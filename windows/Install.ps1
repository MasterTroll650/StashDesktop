param([string[]]$AllowedRoot)
$ErrorActionPreference = 'Stop'
$destination = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'StashExplorer'
$configPath = Join-Path $destination 'config.json'
if (-not $AllowedRoot -and (Test-Path -LiteralPath $configPath)) {
    $AllowedRoot = @((Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json).allowedRoots)
}
if (-not $AllowedRoot) {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Choose the media folder Stash Desktop may reveal in Explorer.'
    $dialog.ShowNewFolderButton = $false
    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 1 }
    $AllowedRoot = @($dialog.SelectedPath)
}
$roots = @($AllowedRoot | ForEach-Object {
    if (-not [IO.Path]::IsPathRooted($_) -or -not (Test-Path -LiteralPath $_ -PathType Container)) {
        throw "Allowed folder does not exist: $_"
    }
    [IO.Path]::GetFullPath($_)
})
if (-not $roots.Count) { throw 'Choose at least one allowed folder.' }
New-Item -ItemType Directory -Path $destination -Force | Out-Null
foreach ($name in @('Open-StashExplorer.ps1', 'PathRules.ps1', 'Launch-StashExplorer.vbs')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination (Join-Path $destination $name) -Force
}
$temporary = Join-Path $destination ('config-' + [Guid]::NewGuid().ToString('N') + '.tmp')
[IO.File]::WriteAllText($temporary, (@{allowedRoots=$roots} | ConvertTo-Json -Depth 4), (New-Object System.Text.UTF8Encoding($false)))
Move-Item -LiteralPath $temporary -Destination $configPath -Force
$key = 'HKCU:\Software\Classes\stashexplorer'
New-Item -Path "$key\shell\open\command" -Force | Out-Null
Set-Item -Path $key -Value 'URL:Stash Desktop'
New-ItemProperty -Path $key -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
$wscript = "$env:WINDIR\System32\wscript.exe"
$launcher = Join-Path $destination 'Launch-StashExplorer.vbs'
Set-Item -Path "$key\shell\open\command" -Value ('"' + $wscript + '" "' + $launcher + '" "%1"')
Write-Host 'Stash Desktop helper is installed for your Windows account.'
Write-Host 'Configure the matching Stash and Windows path prefixes in the plugin settings.'
