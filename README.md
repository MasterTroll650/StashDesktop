# Stash Desktop

Reveal a remote Stash scene file in Windows Explorer using a folder button beside the scene toolbar controls. Stash Desktop reads the selected scene's file paths and opens the matching file on your Windows PC. It does not move or modify media files.

## Install the Stash plugin

Add this source in **Settings → Plugins → Available Plugins → Add Source**:

```text
https://raw.githubusercontent.com/MasterTroll650/StashDesktop/refs/heads/main/index.yml
```

Use `StashDesktop` as the local path, then install **Stash Desktop** from the plugin list. If you previously installed **Windows Explorer** (`stash-explorer`), disable it first and reload the browser page to avoid duplicate controls.

In **Settings → Plugins → Stash Desktop**, set both path prefixes. For example:

| Setting | Example |
| --- | --- |
| Paths \| Stash path prefix | `/media/` |
| Paths \| Windows path prefix | `D:\Media\` |

These translate `/media/studio/scene.mp4` into `D:\Media\studio\scene.mp4`. Absolute UNC paths such as `\\server\share\Media\` are supported too. The Windows path must be accessible to the logged-in Windows account and allowed by the helper. There are no personal path defaults.

## Install the Windows helper once per PC

An existing Stash Explorer helper using `stashexplorer://` remains compatible. Otherwise:

1. Download **StashDesktop-Windows.zip** from [Releases](https://github.com/MasterTroll650/StashDesktop/releases/latest).
2. Extract it and run `windows/Install.cmd` as your normal Windows user.
3. Select the local or mapped media folder the helper may access.
4. Open a scene in Stash and click **Show in Windows Explorer**. Allow the browser to open the `stashexplorer` link when prompted.

The helper installs into `%LOCALAPPDATA%\StashExplorer` and registers the protocol for your Windows account without administrator rights. Its private `config.json` stores allowed folders and is never shipped in the public package. To change allowed roots, run the installer with `-AllowedRoot` through PowerShell, or edit that local configuration. Explorer launches without a PowerShell console window.

The Stash plugin runs on the Stash side; installing it cannot register a Windows protocol on your PC. Mapped drives must exist in the same Windows account used by the helper. If a scene has multiple files, the button asks which file to reveal. Missing mappings and unavailable files produce an error message.

## Development

Run `npm test` for path and toolbar behavior tests. On Windows, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/Test-PathRules.ps1` to validate helper paths and PowerShell syntax without launching Explorer or changing the registry.

Install `requirements-dev.txt` and run `python tools/build_package.py` to build the two release packages and Stash source index. The release workflow publishes them for version tags. Automated tests do not replace a browser protocol/Explorer end-to-end check on a configured PC.
