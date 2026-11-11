#!/usr/bin/env bash
# 服务器就绪脚本（网站还没做好时用这个，不发布任何站点）
# 作用：系统更新 + 时区 + swap + nginx 空站 + 防火墙 + 防爆破 + 自动安全更新
# 用法： sudo bash setup-server.sh
set -euo pipefail

SITE="/var/www/blog"

echo "==================== 0/8 当前配置 ===================="
free -h || true
df -h / || true
echo

echo "==> 1/8 安装基础软件"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -qq
apt-get install -y -qq nginx ufw git unzip curl htop fail2ban unattended-upgrades ca-certificates

echo "==> 2/8 设置时区为 Asia/Shanghai"
timedatectl set-timezone Asia/Shanghai || true

echo "==> 3/8 小内存机型补 swap"
MEM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
if [ "$MEM_MB" -lt 2048 ] && ! swapon --show | grep -q .; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap -q /swapfile
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo 'vm.swappiness=10' >/etc/sysctl.d/99-swap.conf
    sysctl -q -w vm.swappiness=10
    echo "    内存 ${MEM_MB}MB，已添加 2G swap"
else
    echo "    内存 ${MEM_MB}MB，无需 swap"
fi

echo "==> 4/8 创建站点目录与占位页"
mkdir -p "$SITE"
cat >"$SITE/index.html" <<'HTML'
<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>站点建设中</title>
<style>
  :root{--paper:#F3EFE6;--ink:#211F1A;--ink-3:#8B8375;--rule:#D8D0BE;--accent:#9C3B2E}
  html,body{height:100%;margin:0}
  body{background:var(--paper);color:var(--ink);display:grid;place-items:center;
       font-family:"Songti SC","Noto Serif CJK SC",Georgia,serif}
  main{max-width:520px;padding:0 28px;text-align:center}
  h1{font-size:22px;font-weight:600;letter-spacing:.14em;margin:0 0 18px}
  .bar{width:46px;height:2px;background:var(--accent);margin:0 auto 22px;border-radius:2px}
  p{color:var(--ink-3);font-size:14px;line-height:2;margin:0}
  .rule{border-top:1px solid var(--rule);margin:26px 0;opacity:.7}
  small{color:var(--ink-3);font-size:12px;letter-spacing:.08em}
</style>
<main>
  <h1>站 点 建 设 中</h1>
  <div class="bar"></div>
  <p>服务器已经就绪，内容还在路上。<br>很快回来。</p>
  <div class="rule"></div>
  <small>UNDER&nbsp;CONSTRUCTION</small>
</main>
</html>
HTML
chown -R www-data:www-data "$SITE"

echo "==> 5/8 配置 nginx"
cat >/etc/nginx/sites-available/blog <<'CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/blog;
    index index.html;
    charset utf-8;
    error_page 404 /404.html;

    gzip on;
    gzip_vary on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location ~* \.(?:ttf|woff2|jpg|jpeg|png|gif|svg|ico)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(?:css|js)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    location / { try_files $uri $uri/ =404; }
    location ~ /\. { deny all; }
}
CONF
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "==> 6/8 配置防火墙"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 7/8 防 SSH 爆破"
cat >/etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
JAIL
systemctl enable fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban

echo "==> 8/8 开启自动安全更新"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'UPG'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
UPG
systemctl enable unattended-upgrades >/dev/null 2>&1 || true

systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx

echo
echo "==================== 配置结果 ===================="
echo "内存 / swap:"; free -h | sed 's/^/    /'
echo "磁盘:"; df -h / | tail -1 | sed 's/^/    /'
echo "nginx:"; nginx -v 2>&1 | sed 's/^/    /'
echo "防火墙:"; ufw status | sed 's/^/    /'
echo "fail2ban:"; systemctl is-active fail2ban | sed 's/^/    /'
echo "时区:"; date | sed 's/^/    /'
echo "站点目录:"; ls -lh "$SITE" | sed 's/^/    /'
IP="$(curl -s -4 --max-time 5 https://ifconfig.me || echo '<你的公网IP>')"
echo
echo "服务器已就绪 ✅  浏览器打开 http://$IP 应看到「站点建设中」"
echo "以后把网站文件放进 $SITE （或跑 deploy.sh 覆盖）即可上线"
