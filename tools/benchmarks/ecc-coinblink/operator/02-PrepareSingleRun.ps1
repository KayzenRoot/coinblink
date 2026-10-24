# FUTURE ONLY: creates disposable run from a pre-verified snapshot, does not execute Codex.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$PackRoot,
[Parameter(Mandatory=$true)][ValidateSet('T1','T2','T3')][string]$Task,
[Parameter(Mandatory=$true)][ValidateSet('A','B')][string]$Arm,
[Parameter(Mandatory=$true)][ValidateRange(1,3)][int]$Repeat)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '00-Preflight.ps1')
$pack=Resolve-Directory $PackRoot
Check-Pack $pack
$srcRoot=Join-Path $pack "local-artifacts\snapshots\$Task"
if(-not (Test-Path -LiteralPath (Join-Path $srcRoot 'STATUS.txt') -PathType Leaf) -or
  (Get-Content -LiteralPath (Join-Path $srcRoot 'STATUS.txt') -Raw).Trim() -ne 'SNAPSHOT_READY_NOT_HYDRATED'){throw 'Snapshot not ready'}
$origin=Get-Content -LiteralPath (Join-Path $srcRoot 'ORIGIN.json') -Raw | ConvertFrom-Json
$d=Get-Content -LiteralPath (Join-Path $pack "snapshot-descriptors\$Task.json") -Raw | ConvertFrom-Json
if($origin.source_sha -ne $d.base_sha -or $origin.tree_sha -ne $d.tree_sha){throw 'Source identity mismatch'}
$source=Join-Path $srcRoot 'repo'
$hashes=@(Get-Content -LiteralPath (Join-Path $srcRoot 'CONTENT_SHA256.json') -Raw | ConvertFrom-Json)
Assert-Inventory $source $hashes
$runId="$Task-$Arm-r$Repeat"
$run=Join-Path $pack "local-artifacts\runs\$runId"
if(Test-Path -LiteralPath $run){throw 'Run exists: no overwrite'}
$dest=Join-Path $run 'repo'
New-Item -ItemType Directory -Path $dest -Force | Out-Null
'INCOMPLETE_NOT_FOR_AGENT' | Set-Content -LiteralPath (Join-Path $run 'STATUS.txt')
Get-ChildItem -LiteralPath $source -Force | ForEach-Object {Copy-Item -LiteralPath $_.FullName -Destination $dest -Recurse -Force}
Assert-Inventory $dest $hashes
if($Arm -eq 'B'){
  $skills=Join-Path $pack 'agent-materials\adapted-skills'
  $expected=@('ecc-ai-regression','ecc-change-impact','ecc-module-regression','ecc-pr-test-analyzer')
  $skillDirs=@(Get-ChildItem -LiteralPath $skills -Directory -Force)
  if($skillDirs.Count -ne 4){throw 'Unexpected ECC skill inventory'}
  foreach($skill in $skillDirs){
    if($skill.Name -notin $expected -or
      ($skill.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 -or
      -not (Test-Path -LiteralPath (Join-Path $skill.FullName 'SKILL.md') -PathType Leaf)){
      throw 'Unsafe or incomplete ECC skill entry'
    }
    $target=Join-Path $dest ".agents\skills\$($skill.Name)"
    if(Test-Path -LiteralPath $target){throw 'Skill collision'}
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $skill.FullName -Destination $target -Recurse
  }
}
if(Test-Path -LiteralPath (Join-Path $dest '.git')){throw 'History leak'}
if(Test-Path -LiteralPath (Join-Path $dest 'sealed-judges')){throw 'Judge leak'}
[ordered]@{run_id=$runId;task=$Task;arm=$Arm;repeat=$Repeat;source_sha=$d.base_sha;state='PREPARED_NOT_EXECUTED'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $run 'RUN_ORIGIN.json') -Encoding UTF8
'PREPARED_NOT_EXECUTED' | Set-Content -LiteralPath (Join-Path $run 'STATUS.txt')
"PREPARED_NOT_EXECUTED $runId"
