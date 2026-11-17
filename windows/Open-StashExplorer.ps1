param([Parameter(Mandatory=$true)][string]$Link)
$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'PathRules.ps1')
    $configuration = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'config.json') -Raw | ConvertFrom-Json
    $path = Resolve-StashExplorerPath -Link $Link -AllowedRoots @($configuration.allowedRoots)
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "File is not reachable: $path`nCheck your mapped drive or network share."
    }
    Start-Process -FilePath "$env:WINDIR\explorer.exe" -ArgumentList ('/select,"' + $path + '"')
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Stash Desktop')
}
