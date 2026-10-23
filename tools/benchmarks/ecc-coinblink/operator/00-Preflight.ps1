# Imported as helper only; no commands execute on import.
Set-StrictMode -Version Latest
function Resolve-Directory([string]$p) {
  $i=Get-Item -LiteralPath $p -Force -ErrorAction Stop
  if(-not $i.PSIsContainer){throw "Directory expected"}
  $full=[IO.Path]::GetFullPath($i.FullName)
  $volumeRoot=[IO.Path]::GetPathRoot($full)
  if([string]::Equals($full,$volumeRoot,[StringComparison]::OrdinalIgnoreCase)){return $full}
  return $full.TrimEnd([char]92,[char]'/')
}
function Reject-Reparse([string]$p) {
  $curr=[IO.Path]::GetFullPath($p)
  while($curr) {
    if(Test-Path -LiteralPath $curr){
      $item=Get-Item -LiteralPath $curr -Force
      if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw "Symlink or junction forbidden: $curr"}
    }
    $parent=Split-Path -Parent $curr
    if(-not $parent -or $parent -eq $curr){break}
    $curr=$parent
  }
}
function Reject-Overlap([string]$repo,[string]$pack) {
  $a=Resolve-Directory $repo
  $b=Resolve-Directory $pack
  Reject-Reparse $a
  Reject-Reparse $b
  if([string]::Equals($a,$b,[StringComparison]::OrdinalIgnoreCase) -or
     $a.StartsWith($b+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -or
     $b.StartsWith($a+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {
    throw 'Package and source repo must have separate directories.'
  }
}
function Check-Pack([string]$pack) {
  if(-not (Test-Path -LiteralPath (Join-Path $pack '00_LEIA_PRIMEIRO.md') -PathType Leaf) -or
     -not (Test-Path -LiteralPath (Join-Path $pack 'snapshot-descriptors\T1.json') -PathType Leaf)) {throw 'Invalid PackRoot'}
  Reject-Reparse $pack
  # An offline pack must never be operated from inside any live Git worktree.
  $cursor=$pack
  while($cursor){
    if(Test-Path -LiteralPath (Join-Path $cursor '.git')){throw 'PackRoot must be outside every Git checkout'}
    $parent=Split-Path -Parent $cursor
    if(-not $parent -or $parent -eq $cursor){break}
    $cursor=$parent
  }
}
function Inventory([string]$root) {
  $x=@(Get-ChildItem -LiteralPath $root -Force -Recurse)
  if(@($x | Where-Object {($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0}).Count -gt 0){throw 'Reparse point in snapshot'}
  return @($x | Where-Object {-not $_.PSIsContainer} | ForEach-Object {
    [pscustomobject]@{path=$_.FullName.Substring($root.TrimEnd([char]92,[char]'/').Length+1).Replace([IO.Path]::DirectorySeparatorChar,'/');bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
  } | Sort-Object path)
}
function Assert-Inventory([string]$path,[object[]]$expected) {
  $actual=@(Inventory $path)
  if($actual.Count -ne $expected.Count){throw 'Snapshot inventory count changed'}
  for($i=0;$i -lt $actual.Count;$i++){
    if($actual[$i].path -cne $expected[$i].path -or $actual[$i].bytes -ne $expected[$i].bytes -or $actual[$i].sha256 -cne $expected[$i].sha256){throw 'Snapshot inventory hash mismatch'}
  }
}
