# 张航硕 · 个人博客

公开站包括文章、项目、照片墙、留言和联系方式。站长登录后可编辑内容、上传照片、审核留言和查看访问数据。项目使用 Next.js 14 App Router、严格模式 TypeScript、Tailwind CSS、Prisma 和 MySQL 8。

本包固定 Next.js `14.2.35`。按 [Next.js 官方支持政策](https://nextjs.org/support-policy)，14.x 已结束常规维护；建议在长期开放公网前升级到仍受支持的 LTS 版本。

## 在 Ubuntu 上安装

在服务器准备 **Node.js 22 LTS、npm、MySQL 8**。以普通 Linux 用户运行博客，使用 MySQL 管理员单独完成下面的建库步骤。解压 ZIP，进入包含 `package.json` 的目录；后续命令都从这个目录执行。

### 1. 创建数据库

在 MySQL 8 管理终端中执行。数据库和账号名可自行修改，后面的连接串要同步修改。请保存 MySQL 返回的随机密码，用于第二步。以下授权仅覆盖博客数据库，包含首次迁移所需权限。

```sql
CREATE DATABASE `hangshuo_blog` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'hangshuo_blog'@'127.0.0.1' IDENTIFIED BY RANDOM PASSWORD;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON `hangshuo_blog`.* TO 'hangshuo_blog'@'127.0.0.1';
```

MySQL 与博客在同一台服务器时，数据库只需监听本机，无需开放 `3306` 到公网。

### 2. 设置环境变量、安装和构建

下方命令使用 Bash，交互输入 MySQL 密码，并处理连接串所需的 URL 编码。

```bash
read -rsp 'MySQL 应用账号密码：' BLOG_DB_PASSWORD
printf '\n'
export DATABASE_URL="mysql://hangshuo_blog:$(BLOG_DB_PASSWORD="$BLOG_DB_PASSWORD" node -p 'encodeURIComponent(process.env.BLOG_DB_PASSWORD)')@127.0.0.1:3306/hangshuo_blog"
unset BLOG_DB_PASSWORD

# 示例：先在服务器本机验证。PORT 不设置时默认为 3000。
export HOST=127.0.0.1
export PORT=3000
export APP_URL="http://127.0.0.1:$PORT"
export COOKIE_SECURE=false

npm ci --include=dev
npm run build
npm run typecheck
npm run db:migrate
```

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | 必填，MySQL 连接串。可追加 `?connection_limit=3` 显式设置 Prisma 连接池；应用默认限制为 3 条。 |
| `PORT` | 应用监听端口，默认 `3000`。 |
| `HOST` | 监听地址，默认 `0.0.0.0`。本机测试或使用同机 HTTPS 入口时可设为 `127.0.0.1`。 |
| `APP_URL` | 浏览器访问站点所用的完整来源，例如 `https://blog.example.com`。域名、协议和非默认端口需一致，否则表单会返回 403。 |
| `COOKIE_SECURE` | 正式 HTTPS 站点设为 `true`；本机 HTTP 测试设为 `false`。 |

如果构建时内存不足，先检查可用内存和交换空间，再按服务器情况配置 swap；也可在架构和 Node.js 版本一致的 Ubuntu 环境构建后部署。构建默认只用一个工作进程，默认 V8 堆上限为 640 MB；这是 Node.js 的堆设置，实际总内存还包括 MySQL 和其他进程。在 1 GB 主机上建议只启动一个应用实例。照片上传后会占用磁盘，请预留空间。

### 3. 初始化站长与公开内容

```bash
read -rp '站长用户名（3–40 字符）：' ADMIN_USERNAME
read -rsp '站长密码（12–128 字符）：' ADMIN_PASSWORD
printf '\n'
export ADMIN_USERNAME ADMIN_PASSWORD
npm run db:seed
unset ADMIN_USERNAME ADMIN_PASSWORD
```

首次初始化会把 `prisma/data.json` 的旧站公开资料、文章、项目和照片记录写入数据库；照片文件随包保存在 `public/uploads/`。旧站密码、会话、未公开留言和访问记录不在源码包中。导入以记录标识去重；重跑不会覆盖已有记录或重置站长密码。日常发布新代码只需要运行迁移，通常无需重跑初始化。

### 4. 启动和检查

```bash
npm start
```

另开一个终端执行 `curl -fsS http://127.0.0.1:3000/api/health`，应返回 `{"ok":true}`；换端口时改为实际值。浏览器访问首页即可浏览，站长使用 `/login` 登录进入 `/admin`。测试配置只监听服务器本机，可用 SSH 隧道在自己的电脑访问：`ssh -N -L 3000:127.0.0.1:3000 用户名@服务器地址`。

要正式对外访问，请让服务器或托管平台提供 HTTPS 入口，将其转发到应用的 `HOST` 和 `PORT`，把 `APP_URL` 设为对外网址并设置 `COOKIE_SECURE=true`，然后重启。源码包不含反向代理配置；HTTPS 入口的配置取决于你选择的服务商。直接访问自定义端口时，`APP_URL` 要带上该端口。后台请通过 HTTPS 使用。

## 让博客在退出 SSH 后继续运行

前台验证通过后，可交给 Ubuntu 的 systemd。在 `/etc/hangshuo-blog.conf` 写入上表的运行变量，格式为每行 `变量=值`，不写 `export`，不要放入站长密码。建议设文件权限为 `600` 并由 `root` 拥有。通过 `sudoedit` 创建 `/etc/systemd/system/hangshuo-blog.service`，替换 Linux 用户、绝对目录和实际 `node` 路径（用 `command -v node` 查看）：

```ini
[Unit]
Description=Hangshuo Blog
After=network.target mysql.service

[Service]
Type=simple
User=bloguser
WorkingDirectory=/srv/hangshuo-blog
EnvironmentFile=/etc/hangshuo-blog.conf
ExecStart=/usr/bin/node scripts/start.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

先停止前台实例，再运行 `sudo systemctl daemon-reload` 和 `sudo systemctl enable --now hangshuo-blog`。用 `sudo journalctl -u hangshuo-blog -n 100` 查看启动日志。运行用户要能读取项目目录，并能写入 `public/uploads/`；建议让构建、启动使用同一个普通账号。

## 备份和更新

- 备份 **MySQL 数据库与整个 `public/uploads/` 目录**。前者保存内容和权限记录，后者保存图片原件；换服务器时两者一起恢复。在站点目录之外创建备份，例如 `(umask 077; mysqldump -h 127.0.0.1 -u hangshuo_blog -p --single-transaction --no-tablespaces --skip-triggers hangshuo_blog > blog-backup.sql)`。
- 更新前先备份。保留生产服务器的 `public/uploads/` 和运行环境变量，安装新依赖、构建、执行 `npm run db:migrate`，然后重启。不要用新 ZIP 覆盖生产上传目录。
- 上传支持 JPEG、PNG、WebP，单个文件上限 5 MB；请检查上传目录权限和剩余磁盘空间。
- 源码 ZIP 不含依赖目录、构建结果、Git 元数据和环境密钥。服务器须重新执行安装和构建。
