# Synthetic operator smoke test. Never prepares historical snapshots or starts Codex.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot '..\operator\00-Preflight.ps1')
$packageSource = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$base = Join-Path ([IO.Path]::GetTempPath()) ('ecc-unit-' + [Guid]::NewGuid().ToString('N'))
$pack = Join-Path $base 'isolated-pack'
$repo = Join-Path $base 'unused-repo'
function Expect-Fail([scriptblock]$Call, [string]$Name) {
  $failed = $false
  try { & $Call | Out-Null } catch { $failed = $true }
  if(-not $failed) { throw "Expected failure not raised: $Name" }
}
try {
  New-Item -ItemType Directory -Path (Join-Path $pack 'snapshot-descriptors'), $repo -Force | Out-Null
  'synthetic validation' | Set-Content -LiteralPath (Join-Path $pack '00_LEIA_PRIMEIRO.md')
  '{}' | Set-Content -LiteralPath (Join-Path $pack 'snapshot-descriptors\T1.json')
  Check-Pack $pack
  Reject-Overlap $repo $pack

  $inside = Join-Path $repo 'nested'
  New-Item -ItemType Directory -Path $inside -Force | Out-Null
  Expect-Fail { Reject-Overlap $repo $inside } 'Repo overlap'

  $src = Join-Path $pack 'local-artifacts\snapshots\T1\repo'
  New-Item -ItemType Directory -Path $src -Force | Out-Null
  'content' | Set-Content -LiteralPath (Join-Path $src 'a.txt')
  $expected = @(Inventory $src)
  if($expected.Count -ne 1) { throw 'Inventory count incorrect' }
  Assert-Inventory $src $expected
  'mutated' | Set-Content -LiteralPath (Join-Path $src 'a.txt')
  Expect-Fail { Assert-Inventory $src $expected } 'Inventory tampering'
  'content' | Set-Content -LiteralPath (Join-Path $src 'a.txt')
  $expected = @(Inventory $src)

  $descriptor = @{ task='T1';base_sha=('a'*40);tree_sha=('b'*40) } | ConvertTo-Json
  $descriptor | Set-Content -LiteralPath (Join-Path $pack 'snapshot-descriptors\T1.json') -Encoding UTF8
  $snapshot = Split-Path -Parent $src
  @{source_sha=('a'*40);tree_sha=('b'*40)} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $snapshot 'ORIGIN.json') -Encoding UTF8
  @($expected) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $snapshot 'CONTENT_SHA256.json') -Encoding UTF8
  'SNAPSHOT_READY_NOT_HYDRATED' | Set-Content -LiteralPath (Join-Path $snapshot 'STATUS.txt')

  $skills = Join-Path $pack 'agent-materials\adapted-skills'
  $skillNames = @('ecc-ai-regression','ecc-change-impact','ecc-module-regression','ecc-pr-test-analyzer')
  foreach($name in $skillNames) {
    $skillFolder = Join-Path $skills $name
    New-Item -ItemType Directory -Path $skillFolder -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $packageSource "agent-materials\adapted-skills\$name\SKILL.md") -Destination (Join-Path $skillFolder 'SKILL.md')
  }
  $operator = Join-Path $packageSource 'operator\02-PrepareSingleRun.ps1'
  & $operator -PackRoot $pack -Task T1 -Arm A -Repeat 1 | Out-Null
  & $operator -PackRoot $pack -Task T1 -Arm B -Repeat 1 | Out-Null
  $aRun = Join-Path $pack 'local-artifacts\runs\T1-A-r1'
  $bRun = Join-Path $pack 'local-artifacts\runs\T1-B-r1'
  if(-not (Test-Path -LiteralPath (Join-Path $aRun 'RUN_ORIGIN.json'))) { throw 'Missing A run metadata' }
  if(-not (Test-Path -LiteralPath (Join-Path $bRun 'RUN_ORIGIN.json'))) { throw 'Missing B run metadata' }
  foreach($name in $skillNames) {
    if(Test-Path -LiteralPath (Join-Path $aRun "repo\.agents\skills\$name")){throw "A contaminated with $name"}
    if(-not (Test-Path -LiteralPath (Join-Path $bRun "repo\.agents\skills\$name\SKILL.md"))){throw "B missing $name"}
  }
  Expect-Fail { & $operator -PackRoot $pack -Task T1 -Arm B -Repeat 1 } 'Repeat overwrite'

  $quarantine = Join-Path $packageSource 'operator\04-QuarantineRun.ps1'
  Expect-Fail { & $quarantine -PackRoot $pack -RunId 'T1-B-r1' } 'Quarantine requires opt-in'
  & $quarantine -PackRoot $pack -RunId 'T1-B-r1' -IApproveQuarantine | Out-Null
  if(Test-Path -LiteralPath $bRun){throw 'Quarantine did not relocate synthetic B run'}
  $qDirs = @(Get-ChildItem -LiteralPath (Join-Path $pack 'local-artifacts\quarantine') -Directory)
  if($qDirs.Count -ne 1){throw 'Quarantine did not preserve exactly one run'}

  # No Git history, historical snapshots, Codex agents or sealed judges were used.
  Write-Output 'ECC_SYNTHETIC_WINDOWS_OPERATOR_PASS'
} finally {
  if(Test-Path -LiteralPath $base){Remove-Item -LiteralPath $base -Recurse -Force}
}
