param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $QoderArgs
)

$ErrorActionPreference = 'Stop'
$captureDir = Join-Path $env:USERPROFILE '.qoder\usage'
New-Item -ItemType Directory -Path $captureDir -Force | Out-Null
$captureFile = Join-Path $captureDir 'subscription-lens.jsonl'

$command = Get-Command qoder -ErrorAction SilentlyContinue
if (-not $command) { $command = Get-Command qodercli -ErrorAction SilentlyContinue }
if (-not $command) {
  $candidates = @(
    $env:QODER_CLI,
    (Join-Path $env:ProgramData 'Qoder\qodercli.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Qoder\qoder.exe'),
    (Join-Path $env:ProgramFiles 'Qoder\qoder.exe'),
    'D:\AI-Agents\Qoder\qodercli.exe'
  )
  $command = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $command) { throw '未找到 qoder 命令，请先将 Qoder CLI 加入 PATH。' }

$hasFormat = $false
for ($i = 0; $i -lt $QoderArgs.Count; $i++) {
  if ($QoderArgs[$i] -in @('--output-format', '-o')) { $hasFormat = $true; break }
}
if (-not $hasFormat) { $QoderArgs += @('--output-format', 'stream-json') }

& $command @QoderArgs 2>&1 | Tee-Object -FilePath $captureFile -Append
exit $LASTEXITCODE
