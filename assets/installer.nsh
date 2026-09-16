; Preserve the existing installation scope. The standard electron-builder
; installer resolves InstallLocation and invokes the old uninstaller with
; /KEEP_APP_DATA --updated before replacing binaries.
!macro customInstallMode
  ${If} $hasPerUserInstallation == "1"
  ${AndIf} $hasPerMachineInstallation == "0"
    StrCpy $isForceCurrentInstall "1"
  ${ElseIf} $hasPerMachineInstallation == "1"
  ${AndIf} $hasPerUserInstallation == "0"
    StrCpy $isForceMachineInstall "1"
  ${EndIf}
!macroend
