@echo off
REM Script to create Windows NSIS installer for ChromeGenie Client

set APP_NAME=ChromeGenie
set APP_VERSION=1.0.0
set DIST_DIR=dist\chrome-genie-client
set INSTALLER_FILE=%APP_NAME%-%APP_VERSION%-Setup.exe

REM Check if NSIS is installed
where makensis >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo NSIS not found. Download from: https://nsis.sourceforge.io/Download
    echo Adding NSIS to PATH or using full path to makensis.exe
    goto :create_portable
)

REM Create NSIS script
echo Creating NSIS installer script...
(
    echo !include "MUI2.nsh"
    echo.
    echo Name "%APP_NAME%"
    echo OutFile "%INSTALLER_FILE%"
    echo.
    echo !define MUI_ICON "assets\icon.ico"
    echo !define MUI_WELCOMEFINISHPAGE_BITMAP "assets\installer-header.bmp"
    echo !insertmacro MUI_PAGE_WELCOME
    echo !insertmacro MUI_PAGE_DIRECTORY
    echo !insertmacro MUI_PAGE_INSTFILES
    echo !insertmacro MUI_PAGE_FINISH
    echo.
    echo !insertmacro MUI_LANGUAGE "English"
    echo.
    echo Section "Install"
    echo     SetOutPath "$INSTDIR"
    echo     File "%DIST_DIR%\chrome-genie-client-win_x64.exe"
    echo     File "%DIST_DIR%\resources.neu"
    echo     CreateDirectory "$INSTDIR\extensions"
    echo     File /r "%DIST_DIR%\extensions\*.*"
    echo     CreateShortCut "$SMPROGRAMS\%APP_NAME%.lnk" "$INSTDIR\chrome-genie-client-win_x64.exe"
    echo     CreateShortCut "$DESKTOP\%APP_NAME%.lnk" "$INSTDIR\chrome-genie-client-win_x64.exe"
    echo     WriteUninstaller "$INSTDIR\Uninstall.exe"
    echo     WriteRegStr HKLM SOFTWARE\%APP_NAME% "Install_Dir" "$INSTDIR"
    echo SectionEnd
    echo.
    echo Section "Uninstall"
    echo     RMDir /r "$INSTDIR\extensions"
    echo     Delete "$INSTDIR\chrome-genie-client-win_x64.exe"
    echo     Delete "$INSTDIR\resources.neu"
    echo     Delete "$INSTDIR\Uninstall.exe"
    echo     Delete "$SMPROGRAMS\%APP_NAME%.lnk"
    echo     Delete "$DESKTOP\%APP_NAME%.lnk"
    echo     DeleteRegKey HKLM SOFTWARE\%APP_NAME%
    echo     RMDir "$INSTDIR"
    echo SectionEnd
) > installer.nsi

REM Build installer
echo Building installer...
makensis installer.nsi

if exist "%INSTALLER_FILE%" (
    echo Created: %INSTALLER_FILE%
) else (
    echo Failed to create installer
)

REM Cleanup
del installer.nsi

:create_portable
REM Create portable ZIP as alternative
echo.
echo Creating portable ZIP package...
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath 'dist\%APP_NAME%-%APP_VERSION%-Portable.zip' -Force"
echo Created: dist\%APP_NAME%-%APP_VERSION%-Portable.zip
