#!/usr/bin/env bash
# 服务器就绪：Nginx + Node.js 20 + MySQL 8 + PM2 + 防火墙 + swap
# 适用于 Next.js / Node 自研项目（应用文件稍后上传，脚本先把环境备好）
# 用法： sudo bash setup-node-mysql.sh
set -euo pipefail

SITE="/var/www/blog"
APP="/var/www/blog-app"

echo "==================== 0/9 当前配置 ===================="
free -h || true
df -h / || true
echo

echo "==> 1/9 系统更新与基础软件"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -qq
apt-get install -y -qq curl ca-certificates gnupg lsb-release ufw nginx fail2ban \
    unattended-upgrades git unzip build-essential

echo "==> 2/9 时区 Asia/Shanghai"
timedatectl set-timezone Asia/Shanghai || true

echo "==> 3/9 补 swap（Next.js 构建极度吃内存）"
MEM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
if [ "$MEM_MB" -lt 2048 ] && ! swapon --show | grep -q .; then
    if ! fallocate -l 4G /swapfile 2>/dev/null; then
        dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
    fi
    chmod 600 /swapfile
    mkswap -q /swapfile
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    printf 'vm.swappiness=10\nvm.vfs_cache_pressure=50\n' >/etc/sysctl.d/99-swap.conf
    sysctl -q -w vm.swappiness=10 vm.vfs_cache_pressure=50
    echo "    内存 ${MEM_MB}MB，已加 4G swap"
else
    echo "    内存 ${MEM_MB}MB，无需 swap"
fi

echo "==> 4/9 安装 Node.js 20 LTS"
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
echo "    node $(node -v) / npm $(npm -v)"
npm i -g pm2 >/dev/null 2>&1
echo "    pm2 $(pm2 -v 2>/dev/null | tail -1)"

echo "==> 5/9 安装并调优 MySQL 8"
apt-get install -y -qq mysql-server
mkdir -p /etc/mysql/mysql.conf.d
cat >/etc/mysql/mysql.conf.d/99-small-vm.cnf <<'CNF'
[mysqld]
# 小内存机型：压低缓冲池，关掉性能采集，避免 OOM
innodb_buffer_pool_size = 128M
innodb_log_file_size    = 64M
performance_schema      = OFF
max_connections         = 50
bind-address            = 127.0.0.1
CNF
systemctl enable mysql >/dev/null 2>&1 || true
systemctl restart mysql
sleep 3

echo "==> 6/9 创建数据库与账号"
DB_NAME="blog"
DB_USER="bloguser"
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)"
mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
cat >/root/blog-db-credentials.txt <<CRED
数据库地址: 127.0.0.1:3306
数据库名  : ${DB_NAME}
用户名    : ${DB_USER}
密码      : ${DB_PASS}
连接串    : mysql://${DB_USER}:${DB_PASS}@127.0.0.1:3306/${DB_NAME}

root 账号使用 auth_socket 认证，在服务器上执行 sudo mysql 即可免密进入。
CRED
chmod 600 /root/blog-db-credentials.txt
echo "    凭据已写入 /root/blog-db-credentials.txt（仅 root 可读）"

echo "==> 7/9 目录与 Nginx 配置"
mkdir -p "$SITE" "$APP"
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
  <h1>服 务 器 已 就 绪</h1>
  <div class="bar"></div>
  <p>Node.js 20 · MySQL 8 · Nginx 已安装完毕。<br>应用还在路上。</p>
  <div class="rule"></div>
  <small>SERVER&nbsp;READY</small>
</main>
</html>
HTML
chown -R www-data:www-data "$SITE"

cat >/etc/nginx/sites-available/blog <<'CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/blog;
    index index.html;
    charset utf-8;
    error_page 404 /404.html;

    client_max_body_size 25m;

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

    location / { try_files $uri $uri/ =404; }
    location ~ /\. { deny all; }
}
CONF

# 应用就绪后的一键切换模板（反向代理到 Node 的 3000 端口）
APP_CONF=/etc/nginx/sites-available/blog
APPLY=/usr/local/bin/enable-node-app
cat >"$APPLY" <<'SWITCH'
#!/usr/bin/env bash
# 应用用 PM2 跑起来后，执行本脚本把 Nginx 切成反向代理模式
set -euo pipefail
CONF=/etc/nginx/sites-available/blog
cat >"$CONF" <<'CONF_INNER'
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

    # Next.js 静态产物交给 nginx 直接发，省 Node 的 CPU
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
CONF_INNER
nginx -t && systemctl reload nginx
echo "已切换为 Node 反向代理模式（127.0.0.1:3000）"
SWITCH
chmod +x "$APPLY"

ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx

echo "==> 8/9 防火墙"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 9/9 防爆破与自动安全更新"
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

cat >/etc/apt/apt.conf.d/20auto-upgrades <<'UPG'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
UPG
systemctl enable unattended-upgrades >/dev/null 2>&1 || true

echo
echo "==================== 结果 ===================="
echo "内存 / swap:"; free -h | sed 's/^/    /'
echo "磁盘:";       df -h / | tail -1 | sed 's/^/    /'
echo "node / npm:"; node -v | sed 's/^/    /'; npm -v | sed 's/^/    /'
echo "mysql:";      mysql --version | sed 's/^/    /'
echo "nginx:";      nginx -v 2>&1 | sed 's/^/    /'
echo "防火墙:";     ufw status | sed 's/^/    /'
echo "时区:";       date | sed 's/^/    /'
echo
echo "数据库凭据："; sed 's/^/    /' /root/blog-db-credentials.txt
IP="$(curl -s -4 --max-time 5 https://ifconfig.me || echo '<公网IP>')"
echo
echo "服务器已就绪 ✅  http://$IP"
echo "应用上传到 $APP 并用 pm2 启动后，执行 enable-node-app 让 Nginx 转为反代模式"
