set -uo pipefail

# ============================================================
# Enable HTTPS for zhanghangshuo.cn on the Azure VM
#   1) verifies DNS really points to the VM (aborts if not)
#   2) renames nginx server_name to the real domain
#   3) issues Let's Encrypt cert for @ and www, adds 301 redirect
#   4) flips COOKIE_SECURE=true and restarts the app
# Run in Cloud Shell:  bash cloudshell-https.sh
# ============================================================

DOMAIN="zhanghangshuo.cn"
WWW="www.zhanghangshuo.cn"
RG="blog-rg"
VM="boke"
USER_NAME="azureuser"

echo "==== 0/5 locate vm ===="
IP=$(az vm show -d -n "$VM" -g "$RG" --query publicIps -o tsv 2>/dev/null)
if [ -z "$IP" ]; then echo "VM_NOT_FOUND"; exit 1; fi
echo "  vm ip = $IP"

echo "==== 1/5 check dns from cloud shell ===="
RESOLVED=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)
RESOLVED_WWW=$(getent hosts "$WWW" | awk '{print $1}' | head -1)
echo "  $DOMAIN     -> ${RESOLVED:-NONE}"
echo "  $WWW -> ${RESOLVED_WWW:-NONE}"
if [ "${RESOLVED:-}" != "$IP" ]; then
    echo ""
    echo "########## DNS_NOT_READY ##########"
    echo "The domain does not point to $IP yet."
    echo "Add these records in Aliyun DNS, wait a few minutes, then run again:"
    echo "  A  @     -> $IP"
    echo "  A  www   -> $IP"
    echo "Also make sure the .cn real-name review (shiming renzheng) is approved."
    echo "###################################"
    exit 1
fi
echo "  dns ok"

echo "==== 2/5 ssh key ===="
KEY=/tmp/boke_session_key
if [ ! -f "$KEY" ]; then ssh-keygen -t ed25519 -f "$KEY" -N "" -q; fi
az vm user update -n "$VM" -g "$RG" -u "$USER_NAME" \
    --ssh-key-value "$(cat "$KEY.pub")" -o none 2>/dev/null || { echo "KEY_INJECT_FAILED"; exit 1; }
SSHOPT="-i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=20"
echo "  key ready"

echo "==== 3/5 issue certificate on vm ===="
cat > /tmp/https_tpl.sh <<'REMOTE'
set -uo pipefail
DOMAIN="@@DOMAIN@@"
WWW="@@WWW@@"
APP_DIR=/var/www/blog-app
export DEBIAN_FRONTEND=noninteractive

echo "-- server side dns check"
IPHERE=$(curl -s -4 --max-time 8 ifconfig.me || echo "")
LOCALRES=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)
echo "   vm public ip : ${IPHERE:-unknown}"
echo "   domain -> ${LOCALRES:-NONE}"
if [ -z "$LOCALRES" ]; then echo "   DNS_NOT_READY_ON_VM"; exit 1; fi

echo "-- install certbot"
apt-get update -qq >/dev/null 2>&1
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null 2>&1
echo "   certbot $(certbot --version 2>&1 | head -1)"

echo "-- point nginx at the domain"
sed -i "s/server_name _;/server_name $DOMAIN $WWW;/" /etc/nginx/sites-available/blog
if nginx -t >/tmp/n1.log 2>&1; then
    systemctl reload nginx
    echo "   nginx reloaded"
else
    echo "   NGINX_INVALID"; cat /tmp/n1.log; exit 1
fi

echo "-- request certificate"
certbot --nginx -d "$DOMAIN" -d "$WWW" \
    --non-interactive --agree-tos --register-unsafely-without-email --redirect \
    >/tmp/certbot.log 2>&1
CB=$?
tail -14 /tmp/certbot.log | sed 's/^/   /'
if [ $CB -ne 0 ]; then echo "   CERTBOT_FAILED"; exit 1; fi

echo "-- reload after certbot edit"
nginx -t >/dev/null 2>&1 && systemctl reload nginx

echo "-- https local check"
curl -sk -o /dev/null -w "   https://127.0.0.1/ -> %{http_code}\n" --max-time 15 -H "Host: $DOMAIN" https://127.0.0.1/ || true

echo "-- secure cookie + restart app"
if grep -q '^COOKIE_SECURE=' "$APP_DIR/.env"; then
    sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' "$APP_DIR/.env"
else
    echo 'COOKIE_SECURE=true' >>"$APP_DIR/.env"
fi
pm2 restart blog >/dev/null 2>&1 || true
sleep 6
curl -s -o /dev/null -w "   app after restart -> %{http_code}\n" --max-time 15 http://127.0.0.1:3000/api/health || true

echo "-- certificate summary"
certbot certificates 2>/dev/null | grep -E "Certificate Name|Domains|Expiry Date" | sed 's/^/   /'

echo "-- auto renewal"
systemctl list-timers --all 2>/dev/null | grep -i certbot | sed 's/^/   /' || echo "   no certbot timer found"
REMOTE

sed -e "s/@@DOMAIN@@/$DOMAIN/g" -e "s/@@WWW@@/$WWW/g" /tmp/https_tpl.sh > /tmp/https_run.sh
scp $SSHOPT /tmp/https_run.sh "$USER_NAME@$IP:/tmp/https_run.sh" >/dev/null 2>&1
ssh $SSHOPT "$USER_NAME@$IP" 'sudo bash /tmp/https_run.sh'

echo "==== 4/5 verify from the internet ===="
for u in "https://$DOMAIN/" "https://$WWW/" "https://$DOMAIN/login" "http://$DOMAIN/"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 25 "$u" || true)
    echo "  $u -> HTTP ${code:-000}"
done
echo "-- certificate chain seen by clients --"
echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates 2>/dev/null | sed 's/^/  /' || echo "  (openssl check skipped)"

echo "==== 5/5 result ===="
echo ""
echo "########## RESULT ##########"
echo "SITE=https://$DOMAIN/"
echo "ADMIN=https://$DOMAIN/login"
echo "WWW=https://$WWW/"
echo "############################"
