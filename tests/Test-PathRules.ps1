$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\windows\PathRules.ps1')
function New-Link([string]$Path) {
    $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Path)).TrimEnd('=').Replace('+','-').Replace('/','_')
    'stashexplorer://open/' + $encoded
}
function Assert-Equal($Actual,$Expected) {
    if ($Actual -cne $Expected) { throw "Expected '$Expected', got '$Actual'" }
}
function Assert-Rejected([string]$Value) {
    $rejected = $false
    try { $null = Resolve-StashExplorerPath -Link $Value -AllowedRoots @('D:\Media') } catch { $rejected = $true }
    if (-not $rejected) { throw 'Unsafe path was accepted' }
}
Assert-Equal (Resolve-StashExplorerPath -Link (New-Link 'D:\Media\Example\clip one.mkv') -AllowedRoots @('D:\Media')) 'D:\Media\Example\clip one.mkv'
Assert-Equal (Resolve-StashExplorerPath -Link (New-Link 'd:\media\clip.mkv') -AllowedRoots @('D:\Media')) 'd:\media\clip.mkv'
Assert-Equal (Resolve-StashExplorerPath -Link (New-Link '\\server\share\Media\clip.mkv') -AllowedRoots @('\\server\share\Media')) '\\server\share\Media\clip.mkv'
foreach ($path in @('D:\Media-other\clip.mkv','D:\Media\..\outside.mkv','D:\Media\clip.mkv:stream','D:\Media\a".mkv','D:relative.mkv','D:\Other\clip.mkv')) { Assert-Rejected (New-Link $path) }
Assert-Rejected 'stashexplorer://open/invalid%payload'
Assert-Rejected 'https://example.com/open/test'
$tokens=$null; $errors=$null
Get-ChildItem (Join-Path $PSScriptRoot '..\windows\*.ps1') | ForEach-Object {
    [void][System.Management.Automation.Language.Parser]::ParseFile($_.FullName,[ref]$tokens,[ref]$errors)
    if ($errors) { throw ($errors | Out-String) }
}
Write-Output 'Windows path validation and PowerShell syntax checks passed; no Explorer launch or registry changes.'
