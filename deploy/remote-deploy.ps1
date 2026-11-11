# 远程配置 Azure VM
#   -ServerOnly ：只把服务器配好（装 nginx / 防火墙 / swap / 防爆破），不发布网站  ← 现在用这个
#   不带参数    ：把已打包的博客站点发布上线
#
# 用法： .\remote-deploy.ps1 -Ip 20.x.x.x -User azureuser -Key C:\path\boke_key.pem -ServerOnly
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Ip,
    [string]$User = "azureuser",
    [Parameter(Mandatory)][string]$Key,
    [switch]$ServerOnly
)

$ErrorActionPreference = "Stop"
$SSH = "C:\Windows\System32\OpenSSH\ssh.exe"
$SCP = "C:\Windows\System32\OpenSSH\scp.exe"
$BASE = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($ServerOnly) {
    $PAYLOAD = Join-Path $BASE "setup-server.sh"
    $NEED = @($SSH, $SCP, $PAYLOAD)
} else {
    $PAYLOAD = Join-Path $BASE "blog-dist.zip"
    $NEED = @($SSH, $SCP, $PAYLOAD, (Join-Path $BASE "deploy.sh"))
}
foreach ($f in $NEED) { if (-not (Test-Path $f)) { throw "缺少文件：$f" } }
if (-not (Test-Path $Key)) { throw "找不到密钥：$Key" }

$OPTS = @("-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15")
$TARGET = "${User}@${Ip}"

Write-Host "==> [1/6] 探测 $Ip" -ForegroundColor Cyan
foreach ($port in 22, 80) {
    $r = Test-NetConnection -ComputerName $Ip -Port $port -WarningAction SilentlyContinue
    Write-Host ("    {0}/tcp : {1}" -f $port, $(if ($r.TcpTestSucceeded) { "开放" } else { "不通" }))
}
if (-not (Test-NetConnection -ComputerName $Ip -Port 22 -WarningAction SilentlyContinue).TcpTestSucceeded) {
    throw "22 端口不通：VM 可能还在启动，或 NSG 未放行 SSH。"
}

Write-Host "==> [2/6] 上传配置脚本" -ForegroundColor Cyan
& $SCP @OPTS -i $Key $PAYLOAD "${TARGET}:/tmp/"
if ($LASTEXITCODE -ne 0) { throw "scp 上传失败" }
if (-not $ServerOnly) {
    & $SCP @OPTS -i $Key (Join-Path $BASE "deploy.sh") "${TARGET}:/tmp/"
    if ($LASTEXITCODE -ne 0) { throw "scp 上传 deploy.sh 失败" }
}

Write-Host "==> [3/6] 校验脚本语法（在服务器上跑 bash -n，通过后才执行）" -ForegroundColor Cyan
$check = if ($ServerOnly) { "bash -n /tmp/setup-server.sh" } else { "bash -n /tmp/deploy.sh" }
& $SSH @OPTS -i $Key $TARGET $check
if ($LASTEXITCODE -ne 0) { throw "服务器上语法检查不通过，已中止，未做任何改动。" }
Write-Host "    语法 OK"

Write-Host "==> [4/6] 执行服务器配置（约 1-3 分钟）" -ForegroundColor Cyan
if ($ServerOnly) {
    $remote = "sudo bash /tmp/setup-server.sh"
} else {
    $remote = "sudo apt-get update -qq && sudo apt-get install -y -qq unzip && " +
              "sudo rm -rf /tmp/blog-dist && sudo unzip -oq /tmp/blog-dist.zip -d /tmp/blog-dist && " +
              "sudo bash /tmp/deploy.sh"
}
& $SSH @OPTS -i $Key $TARGET $remote
if ($LASTEXITCODE -ne 0) { throw "远程执行失败，上面是服务器输出" }

Write-Host "==> [5/6] 从公网回访验证" -ForegroundColor Cyan
Start-Sleep -Seconds 3
$ok = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://$Ip/" -UseBasicParsing -TimeoutSec 15
        Write-Host ("    首页 HTTP {0}，{1} 字节" -f $resp.StatusCode, $resp.RawContentLength)
        $ok = $resp.StatusCode -eq 200
        if ($ok) { break }
    } catch {
        Write-Host ("    第 {0} 次重试：{1}" -f $i, $_.Exception.Message)
    }
    Start-Sleep -Seconds 4
}

Write-Host "==> [6/6] 服务器状态速览" -ForegroundColor Cyan
& $SSH @OPTS -i $Key $TARGET "free -h | head -2; echo; ufw status | head -8; echo; systemctl is-active nginx fail2ban; echo; du -sh /var/www/blog"
Write-Host "`n    当前站点目录："
& $SSH @OPTS -i $Key $TARGET "ls -1 /var/www/blog"

if ($ok) {
    Write-Host "`n完成 ✅  http://$Ip" -ForegroundColor Green
} else {
    Write-Host "`n配置跑完了，但公网 80 访问不通 —— 大概率是 NSG 没放行 80。" -ForegroundColor Yellow
}
