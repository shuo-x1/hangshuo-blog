set -uo pipefail

# ============================================================
# Deploy / UPDATE hangshuo-blog (Next.js 14 + Prisma) on the Azure VM
#
# Safe to re-run. A redeploy KEEPS:
#   - database content (articles, photos, messages)
#   - uploaded images in public/uploads
#   - .env (admin password, DATABASE_URL, COOKIE_SECURE)
#   - the HTTPS / nginx certificate configuration
#
# Usage in Azure Cloud Shell:
#   1) upload your new zip  (lands in ~/ or ~/uploads/)
#   2) bash cloudshell-deploy-app.sh
# ============================================================

RG="blog-rg"
VM="boke"
USER_NAME="azureuser"
APP_NAME="blog"

echo "==== 1/7 locate vm ===="
IP=$(az vm show -d -n "$VM" -g "$RG" --query publicIps -o tsv 2>/dev/null)
if [ -z "$IP" ]; then echo "VM_NOT_FOUND"; exit 1; fi
echo "  ip=$IP"

echo "==== 2/7 locate zip ===="
ZIP=""
for c in /tmp/app.zip "$HOME/app.zip"; do
    if [ -f "$c" ]; then ZIP="$c"; break; fi
done
if [ -z "$ZIP" ]; then
    ZIP=$(ls -t "$HOME"/*.zip 2>/dev/null | head -1)
fi
if [ -z "$ZIP" ]; then
    ZIP=$(ls -t "$HOME"/uploads/*.zip 2>/dev/null | head -1)
fi
if [ -z "$ZIP" ]; then
    echo "  NO_ZIP_FOUND. contents of home:"
    ls -la "$HOME" 2>/dev/null
    exit 1
fi
echo "  zip=$ZIP ($(du -h "$ZIP" | cut -f1))"

echo "==== 3/7 ssh key ===="
KEY=/tmp/boke_session_key
if [ ! -f "$KEY" ]; then ssh-keygen -t ed25519 -f "$KEY" -N "" -q; fi
az vm user update -n "$VM" -g "$RG" -u "$USER_NAME" \
    --ssh-key-value "$(cat "$KEY.pub")" -o none 2>/dev/null || { echo "KEY_INJECT_FAILED"; exit 1; }
SSHOPT="-i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=20"
echo "  key ready"

echo "==== 4/7 upload ===="
scp $SSHOPT "$ZIP" "$USER_NAME@$IP:/tmp/app.zip" || { echo "UPLOAD_FAILED"; exit 1; }
echo "  uploaded"

echo "==== 5/7 remote build and restart ===="
cat > /tmp/boke_remote.sh <<'REMOTE'
set -uo pipefail
APP_DIR=/var/www/blog-app
APP_NAME=blog
export DEBIAN_FRONTEND=noninteractive
export PM2_HOME=/root/.pm2

echo "-- tools"
apt-get install -y -qq unzip rsync >/dev/null 2>&1

echo "-- unpack"
rm -rf /tmp/app_unpack && mkdir -p /tmp/app_unpack
unzip -oq /tmp/app.zip -d /tmp/app_unpack
SRC=$(find /tmp/app_unpack -maxdepth 3 -name package.json -not -path '*/node_modules/*' -printf '%h\n' | head -1)
if [ -z "$SRC" ]; then echo "   NO_PACKAGE_JSON"; exit 1; fi
echo "   source=$SRC"

echo "-- sync code (keep uploads, .env, run.sh)"
mkdir -p "$APP_DIR" "$APP_DIR/public/uploads"
rsync -a --delete \
    --exclude node_modules --exclude .next \
    --exclude .env --exclude run.sh \
    --exclude public/uploads \
    "$SRC"/ "$APP_DIR"/
cd "$APP_DIR"
echo "   code synced"

echo "-- launcher (rewritten every time)"
cat >"$APP_DIR/run.sh" <<'LAUNCH'
#!/usr/bin/env bash
cd "$(dirname "$0")"
set -a
. ./.env
set +a
exec npm run start
LAUNCH
chmod +x "$APP_DIR/run.sh"
echo "   run.sh ok"

echo "-- env"
if [ -f "$APP_DIR/.env" ]; then
    echo "   .env exists, kept (password and COOKIE_SECURE untouched)"
    sed 's/=.*/=***/' "$APP_DIR/.env" | sed 's/^/     /'
else
    DBPASS=$(grep '^DB_PASS=' /root/blog-db-credentials.txt | cut -d= -f2-)
    ADMINPASS=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-16)
    cat >"$APP_DIR/.env" <<ENV
DATABASE_URL=mysql://bloguser:${DBPASS}@127.0.0.1:3306/blog
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMINPASS}
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
COOKIE_SECURE=true
ENV
    chmod 640 "$APP_DIR/.env"
    echo "   .env created with a NEW admin password (see bottom)"
fi

echo "-- npm ci (devDeps needed: prisma cli + tsx)"
export NODE_OPTIONS=--max-old-space-size=768
if npm ci --no-audit --no-fund >/tmp/npm_ci.log 2>&1; then
    echo "   npm ci ok"
else
    echo "   NPM_CI_FAILED"
    tail -25 /tmp/npm_ci.log
    exit 1
fi

echo "-- prisma migrate deploy"
if npx prisma migrate deploy >/tmp/migrate.log 2>&1; then
    echo "   migrate ok"
else
    echo "   MIGRATE_FAILED"
    tail -25 /tmp/migrate.log
    exit 1
fi

echo "-- seed (adds missing content, never overwrites admin)"
if npx tsx prisma/seed.ts >/tmp/seed.log 2>&1; then
    echo "   seed ok"
    tail -2 /tmp/seed.log | sed 's/^/     /'
else
    echo "   seed skipped/failed (app can still run)"
fi

echo "-- build"
if npm run build >/tmp/build.log 2>&1; then
    echo "   build ok"
else
    echo "   BUILD_FAILED"
    tail -40 /tmp/build.log
    exit 1
fi

echo "-- pm2 restart"
pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
pm2 start "$APP_DIR/run.sh" --name "$APP_NAME" --cwd "$APP_DIR" >/dev/null 2>&1
sleep 10
pm2 save >/dev/null 2>&1
pm2 list | sed 's/^/   /'

echo "-- nginx (keep HTTPS config if already issued)"
NGX=/etc/nginx/sites-available/blog
if [ -f "$NGX" ] && grep -q "listen 443" "$NGX"; then
    echo "   existing HTTPS config detected, left untouched"
else
    cat >"$NGX" <<'CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    charset utf-8;
    client_max_body_size 25m;
    gzip on;
    gzip_vary on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml image/avif;
    location /_next/static/ {
        alias /var/www/blog-app/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
CONF
    echo "   http-only config written (run cloudshell-https.sh to add TLS)"
fi
ln -sf "$NGX" /etc/nginx/sites-enabled/blog
rm -f /etc/nginx/sites-enabled/default
if nginx -t >/tmp/nginx_test.log 2>&1; then
    systemctl reload nginx
    echo "   nginx reloaded"
else
    echo "   NGINX_INVALID"
    cat /tmp/nginx_test.log
fi

echo "-- health"
sleep 5
H1=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 http://127.0.0.1:3000/api/health || true)
H2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 http://127.0.0.1/ || true)
echo "   app  /api/health -> HTTP ${H1:-000}"
echo "   nginx /          -> HTTP ${H2:-000}"
if [ "${H1:-000}" != "200" ]; then
    echo "-- app error log --"
    pm2 logs "$APP_NAME" --err --lines 30 --nostream 2>/dev/null | tail -35
fi
REMOTE

ssh $SSHOPT "$USER_NAME@$IP" 'sudo bash -s' < /tmp/boke_remote.sh

echo "==== 6/7 verify from the internet ===="
for u in "https://zhanghangshuo.cn/" "https://zhanghangshuo.cn/login" "https://zhanghangshuo.cn/api/health" "http://$IP/"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 25 "$u" || true)
    echo "  $u -> HTTP ${code:-000}"
done

echo "==== 7/7 result ===="
echo ""
echo "########## RESULT ##########"
echo "SITE=https://zhanghangshuo.cn/"
echo "ADMIN=https://zhanghangshuo.cn/login"
echo "IP=$IP"
echo "############################"
