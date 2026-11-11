set -uo pipefail

# ============================================================
# Fix: PM2 does not load .env, so scripts/start.mjs aborts
#      (DATABASE_URL is required) and nginx returns 502.
# Also prints the real app error if something else is wrong.
# Upload then run:  bash cloudshell-fix.sh
# ============================================================

RG="blog-rg"
VM="boke"
USER_NAME="azureuser"
APP_DIR="/var/www/blog-app"
APP_NAME="blog"

echo "==== 0/4 locate vm ===="
IP=$(az vm show -d -n "$VM" -g "$RG" --query publicIps -o tsv 2>/dev/null)
if [ -z "$IP" ]; then echo "VM_NOT_FOUND"; exit 1; fi
echo "  ip=$IP"

KEY=/tmp/boke_session_key
if [ ! -f "$KEY" ]; then ssh-keygen -t ed25519 -f "$KEY" -N "" -q; fi
az vm user update -n "$VM" -g "$RG" -u "$USER_NAME" \
    --ssh-key-value "$(cat "$KEY.pub")" -o none 2>/dev/null || { echo "KEY_INJECT_FAILED"; exit 1; }
SSHOPT="-i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=20"
echo "  key ready"

echo "==== 1/4 restart app with .env loaded ===="
cat > /tmp/boke_fix.sh <<'REMOTE'
set -uo pipefail
APP_DIR=/var/www/blog-app
APP_NAME=blog

echo "-- write launcher that sources .env"
cat >"$APP_DIR/run.sh" <<'LAUNCH'
#!/usr/bin/env bash
cd "$(dirname "$0")"
set -a
. ./.env
set +a
exec npm run start
LAUNCH
chmod +x "$APP_DIR/run.sh"
echo "   launcher written"

echo "-- env keys present"
cut -d= -f1 "$APP_DIR/.env" | sed 's/^/     /'

echo "-- pm2 restart"
pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
pm2 start "$APP_DIR/run.sh" --name "$APP_NAME" --cwd "$APP_DIR" >/dev/null 2>&1
sleep 12
pm2 save >/dev/null 2>&1
pm2 list | sed 's/^/   /'

echo "-- listening check"
ss -ltn 2>/dev/null | grep -E ':3000|:80 ' | sed 's/^/   /' || echo "   nothing on 3000"

echo "-- health check"
H=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 http://127.0.0.1:3000/api/health || true)
echo "   app /api/health -> HTTP ${H:-000}"
N=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 http://127.0.0.1/ || true)
echo "   nginx /         -> HTTP ${N:-000}"

if [ "${H:-000}" != "200" ]; then
    echo ""
    echo "-- APP ERROR LOG (last 50 lines) --"
    pm2 logs "$APP_NAME" --err --lines 50 --nostream 2>/dev/null | tail -55
    echo "-- STDOUT LOG (last 30 lines) --"
    pm2 logs "$APP_NAME" --out --lines 30 --nostream 2>/dev/null | tail -35
    echo "-- pm2 describe --"
    pm2 describe "$APP_NAME" 2>/dev/null | head -30
    echo "-- build output present? --"
    ls -d "$APP_DIR/.next" 2>/dev/null && du -sh "$APP_DIR/.next" 2>/dev/null
    echo "-- node --"
    node -v
    echo "-- direct run test (5s) --"
    cd "$APP_DIR"
    set -a; . ./.env; set +a
    timeout 5 node scripts/start.mjs 2>&1 | head -25
fi

echo ""
echo "##### ADMIN LOGIN #####"
echo "URL=http://$(curl -s -4 --max-time 5 ifconfig.me || echo "$IP")/login"
echo "USERNAME=$(grep '^ADMIN_USERNAME=' "$APP_DIR/.env" | cut -d= -f2)"
echo "PASSWORD=$(grep '^ADMIN_PASSWORD=' "$APP_DIR/.env" | cut -d= -f2)"
echo "#######################"
REMOTE

scp $SSHOPT /tmp/boke_fix.sh "$USER_NAME@$IP:/tmp/boke_fix.sh" >/dev/null 2>&1
ssh $SSHOPT "$USER_NAME@$IP" 'sudo bash /tmp/boke_fix.sh'

echo ""
echo "==== 2/4 verify from internet ===="
for path in "/" "/blog" "/api/health" "/login"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "http://$IP$path" || true)
    echo "  http://$IP$path -> HTTP ${code:-000}"
done

echo "==== 3/4 nginx error log (if still 502) ===="
ssh $SSHOPT "$USER_NAME@$IP" "sudo tail -12 /var/log/nginx/error.log 2>/dev/null"

echo "==== 4/4 done ===="
echo "########## RESULT ##########"
echo "PUBLIC_IP=$IP"
echo "SITE=http://$IP/"
echo "ADMIN=http://$IP/login"
echo "############################"
