# FUTURE ONLY: never run in CoinBlink checkout. No network or install.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$RepoPath,[Parameter(Mandatory=$true)][string]$PackRoot)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '00-Preflight.ps1')
$repo=Resolve-Directory $RepoPath; $pack=Resolve-Directory $PackRoot
Check-Pack $pack
Reject-Overlap $repo $pack
foreach($t in @('git','tar')){if(-not (Get-Command $t -ErrorAction SilentlyContinue)){throw "Missing $t: STOP"}}
$top=(& git -C $repo rev-parse --show-toplevel 2>&1 | Out-String).Trim()
if($LASTEXITCODE -ne 0 -or -not [string]::Equals((Resolve-Directory $top),$repo,[StringComparison]::OrdinalIgnoreCase)){throw 'RepoPath must be Git root'}
$destination=Join-Path $pack 'local-artifacts\snapshots'
if(Test-Path -LiteralPath $destination){throw 'Snapshots already exist: no overwrite'}
$cases=@(foreach($task in @('T1','T2','T3')){
  $d=Get-Content -LiteralPath (Join-Path $pack "snapshot-descriptors\$task.json") -Raw | ConvertFrom-Json
  if($d.task -ne $task -or $d.base_sha -notmatch '^[a-f0-9]{40}$' -or $d.tree_sha -notmatch '^[a-f0-9]{40}$'){throw 'Invalid descriptor'}
  & git -C $repo cat-file -e ($d.base_sha+'^{commit}')
  if($LASTEXITCODE -ne 0){throw "Git object absent $task; NO fetch"}
  $tree=(& git -C $repo rev-parse ($d.base_sha+'^{tree}') 2>&1 | Out-String).Trim()
  if($LASTEXITCODE -ne 0 -or $tree -cne $d.tree_sha){throw "Historical tree mismatch $task"}
  # Git archives may contain symbolic links or submodules. Reject them before tar extraction.
  $entries=@(& git -C $repo ls-tree -r $d.base_sha)
  if($LASTEXITCODE -ne 0){throw "Cannot inspect tree entries $task"}
  if(@($entries | Where-Object {$_ -match '^(120000|160000)\s'}).Count -gt 0){
    throw "Archive contains symlink or submodule: STOP $task"
  }
  $d
})
New-Item -ItemType Directory -Path $destination -ErrorAction Stop | Out-Null
foreach($d in $cases){
  $taskRoot=Join-Path $destination $d.task
  $dest=Join-Path $taskRoot 'repo'
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
  $status=Join-Path $taskRoot 'STATUS.txt'
  'INCOMPLETE_NOT_FOR_AGENT' | Set-Content -LiteralPath $status
  $tmp=Join-Path $taskRoot '_archive.tmp.tar'
  & git -C $repo archive --format=tar --output=$tmp $d.base_sha
  if($LASTEXITCODE -ne 0){throw "Archive failed $($d.task)"}
  $names=@(& tar -tf $tmp)
  if($LASTEXITCODE -ne 0){throw 'Corrupt tar'}
  if($names.Count -eq 0){throw 'Empty archive'}
  foreach($name in $names){
    # Reject traversal, Windows alternate separators, absolute paths and drive paths.
    if([string]::IsNullOrWhiteSpace($name) -or $name.Contains([char]92) -or
      $name.StartsWith('/') -or $name -match '^[a-zA-Z]:' -or
      $name -match '(^|/)\.\.(/|$)' -or $name -match '(^|/)(CON|PRN|AUX|NUL)(\.|/|$)'){
      throw "Unsafe archive path in $($d.task): STOP"
    }
  }
  & tar -xf $tmp -C $dest
  if($LASTEXITCODE -ne 0){throw 'Unpack failed'}
  Remove-Item -LiteralPath $tmp -Force
  if(Test-Path -LiteralPath (Join-Path $dest '.git')){throw 'History leak'}
  if(Test-Path -LiteralPath (Join-Path $dest 'node_modules')){throw 'Unexpected dependencies'}
  $inv=@(Inventory $dest)
  $inv | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $taskRoot 'CONTENT_SHA256.json') -Encoding UTF8
  [ordered]@{task=$d.task;source_sha=$d.base_sha;tree_sha=$d.tree_sha;file_count=$inv.Count;runtime_validated=$false} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskRoot 'ORIGIN.json') -Encoding UTF8
  'SNAPSHOT_READY_NOT_HYDRATED' | Set-Content -LiteralPath $status
}
'SNAPSHOTS_PREPARED_NOT_TESTED'
