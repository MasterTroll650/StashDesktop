function Resolve-StashExplorerPath {
    param([Parameter(Mandatory=$true)][string]$Link,
          [Parameter(Mandatory=$true)][string[]]$AllowedRoots)
    if ($Link.Length -gt 16384 -or $Link -cnotmatch '^stashexplorer://open/([A-Za-z0-9_-]+)/?$') {
        throw 'Invalid Stash Explorer link.'
    }
    $payload = $Matches[1].Replace('-', '+').Replace('_', '/')
    $payload = $payload.PadRight($payload.Length + ((4 - $payload.Length % 4) % 4), '=')
    $strictUtf8 = New-Object System.Text.UTF8Encoding($false, $true)
    $path = $strictUtf8.GetString([Convert]::FromBase64String($payload))
    if ($path -match '[\x00-\x1f"<>|?*]' -or $path.Contains('/') -or
        ($path -notmatch '^[A-Za-z]:\\' -and $path -notmatch '^\\\\[^\\]+\\[^\\]+') -or
        $path.IndexOf(':', 2) -ge 0) { throw 'Invalid Windows file path.' }
    $path = [IO.Path]::GetFullPath($path)
    foreach ($root in $AllowedRoots) {
        if ([string]::IsNullOrWhiteSpace($root)) { continue }
        $fullRoot = [IO.Path]::GetFullPath($root).TrimEnd('\') + '\'
        if ($path.StartsWith($fullRoot, [StringComparison]::OrdinalIgnoreCase)) { return $path }
    }
    throw 'This file is outside the folders allowed by the desktop helper.'
}
