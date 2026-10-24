# Future quarantine only, explicit opt-in, never touches git.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$PackRoot,
[Parameter(Mandatory=$true)][ValidatePattern('^T[123]-[AB]-r[123]$')][string]$RunId,
[Parameter(Mandatory=$true)][switch]$IApproveQuarantine)
$ErrorActionPreference='Stop'
if(-not $IApproveQuarantine){throw 'Approval switch required'}
. (Join-Path $PSScriptRoot '00-Preflight.ps1')
$pack=Resolve-Directory $PackRoot
Check-Pack $pack
$source=Join-Path $pack "local-artifacts\runs\$RunId"
if(-not (Test-Path -LiteralPath $source -PathType Container)){throw 'Missing run'}
Reject-Reparse $source
$metaFile=Join-Path $source 'RUN_ORIGIN.json'
if(-not (Test-Path -LiteralPath $metaFile -PathType Leaf)){throw 'Missing origin: cannot quarantine'}
$meta=Get-Content -LiteralPath $metaFile -Raw | ConvertFrom-Json
if($meta.run_id -ne $RunId){throw 'Origin mismatch'}
$root=Join-Path $pack 'local-artifacts\quarantine'
$target=Join-Path $root ($RunId+'-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
if(Test-Path -LiteralPath $target){throw 'Target collision'}
New-Item -ItemType Directory -Path $root -Force | Out-Null
Move-Item -LiteralPath $source -Destination $target
"QUARANTINED_NO_DELETE $target"
