Option Explicit
Dim shell, fso, helper, powershell, link, regex, command
If WScript.Arguments.Count <> 1 Then WScript.Quit 1
link = WScript.Arguments(0)
Set regex = New RegExp
regex.Pattern = "^stashexplorer://open/[A-Za-z0-9_-]+/?$"
regex.IgnoreCase = False
If Not regex.Test(link) Then WScript.Quit 1
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
helper = fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "Open-StashExplorer.ps1")
powershell = shell.ExpandEnvironmentStrings("%WINDIR%\System32\WindowsPowerShell\v1.0\powershell.exe")
command = Chr(34) & powershell & Chr(34) & " -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File " & Chr(34) & helper & Chr(34) & " -Link " & Chr(34) & link & Chr(34)
shell.Run command, 0, False
