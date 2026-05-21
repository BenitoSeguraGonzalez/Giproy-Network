Set WshShell = CreateObject("WScript.Shell")
' Get the directory of this script
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
' Run the Launcher.bat located in the project root (one level up from tools/launcher)
' 0 = Hide window, True = Wait for completion
WshShell.Run """" & strPath & "..\..\Launcher.bat" & """", 0, False
