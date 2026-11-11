set -uo pipefail

# ============================================================
# Make the blog survive a VM reboot.
#   - standardize PM2_HOME to /root/.pm2
#   - install + enable systemd unit pm2-root
#   - reboot once and verify the site comes back by itself
# Upload then run:  bash cloudshell-autostart.sh
# ============================================================

RG="blog-rg"
VM="boke"
USER_NAME="azureuser"

echo "==== 0/5 locate vm ===="
IP=$(az vm show -d -n "$VM" -g "$RG" --query publicIps -o tsv 2>/dev/null)
if [ -z "$IP" ]; then echo "VM_NOT_FOUND"; exit 1; fi
echo "  ip=$IP"

KEY=/tmp/boke_session_key
if [ ! -f "$KEY" ]; then ssh-keygen -t ed25519 -f "$KEY" -N "" -q; fi
az vm user update -n "$VM" -g "$RG" -u "$USER_NAME" \
    --ssh-key-value "$(cat "$KEY.pub")" -o none 2>/dev/null || { echo "KEY_INJECT_FAILED"; exit 1; }
SSHOPT="-i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=20"
echo "  key ready"

echo "==== 1/5 rebuild pm2 setup under /root/.pm2 ===="
cat > /tmp/boke_autostart.sh <<'REMOTE'
set -uo pipefail
export PM2_HOME=/root/.pm2

echo "-- kill old daemons"
PM2_HOME=/home/azureuser/.pm2 pm2 kill >/dev/null 2>&1 || true
pm2 kill >/dev/null 2>&1 || true
sleep 2

echo "-- start app"
pm2 start /var/www/blog-app/run.sh --name blog --cwd /var/www/blog-app >/dev/null 2>&1
sleep 10
pm2 save >/dev/null 2>&1
pm2 list | sed 's/^/   /'

echo "-- install systemd unit"
env PATH=$PATH PM2_HOME=/root/.pm2 pm2 startup systemd -u root --hp /root >/tmp/pm2startup.log 2>&1 || true
grep -i "systemd\|pm2-root" /tmp/pm2startup.log | tail -3 | sed 's/^/   /'
systemctl daemon-reload
systemctl enable pm2-root >/dev/null 2>&1 || true
echo -n "   pm2-root enabled: "
systemctl is-enabled pm2-root 2>/dev/null || echo "NO"
echo -n "   pm2-root active : "
systemctl is-active pm2-root 2>/dev/null || echo "NO"

echo "-- enable boot services"
systemctl enable nginx >/dev/null 2>&1 || true
systemctl enable mysql >/dev/null 2>&1 || true
echo "   nginx: $(systemctl is-enabled nginx 2>/dev/null)"
echo "   mysql: $(systemctl is-enabled mysql 2>/dev/null)"

echo "-- dump file"
ls -l /root/.pm2/dump.pm2 2>/dev/null | sed 's/^/   /' || echo "   NO DUMP FILE"

echo "-- local check"
curl -s -o /dev/null -w "   http://127.0.0.1/ -> %{http_code}\n" --max-time 15 || true
REMOTE

scp $SSHOPT /tmp/boke_autostart.sh "$USER_NAME@$IP:/tmp/boke_autostart.sh" >/dev/null 2>&1
ssh $SSHOPT "$USER_NAME@$IP" 'sudo bash /tmp/boke_autostart.sh'

echo "==== 2/5 verify before reboot ===="
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "http://$IP/" || true)
echo "  http://$IP/ -> HTTP ${code:-000}"

echo "==== 3/5 reboot the vm (site will be down ~60-90s) ===="
az vm restart -n "$VM" -g "$RG" -o none 2>/dev/null || echo "  restart command failed"
echo "  waiting 90s..."
sleep 90

echo "==== 4/5 verify after reboot (no manual action taken) ===="
OK=""
for i in $(seq 1 12); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "http://$IP/" || true)
    echo "  attempt $i: HTTP ${code:-000}"
    if [ "${code:-000}" = "200" ]; then OK="yes"; break; fi
    sleep 10
done

echo "==== 5/5 result ===="
if [ -n "$OK" ]; then
    echo ""
    echo "########## SUCCESS ##########"
    echo "VM rebooted and the site came back BY ITSELF."
    echo "SITE=http://$IP/"
    echo "ADMIN=http://$IP/login"
    echo "You never need to touch Cloud Shell again."
    echo "#############################"
else
    echo ""
    echo "########## STILL DOWN ##########"
    echo "Site did not come back after reboot. Diagnostics:"
    ssh $SSHOPT "$USER_NAME@$IP" "sudo systemctl status pm2-root --no-pager 2>&1 | head -20; echo '--- journal ---'; sudo journalctl -u pm2-root --no-pager -n 30 2>&1"
    echo "Send this output back."
    echo "#############################"
fi
