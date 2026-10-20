@echo off
chcp 65001 >nul
title Instalador de Escritorio · NovaSystem POS - Dr. Empanadas
cls
echo =====================================================================
echo           NOVASYSTEM POS - DR. EMPANADAS C.A. (VENEZUELA)
echo             Instalador de Escritorio Nativo para Windows
echo =====================================================================
echo.
echo Este instalador configurara el Punto de Venta en tu computadora
echo para abrirse como aplicacion independiente de escritorio (sin barras
echo de navegador) y con soporte para trabajar SIN CONEXION A INTERNET.
echo.

set APP_URL=https://dr-empanadas.valetdemo.workers.dev
set APP_NAME=NovaSystem TPV - Dr. Empanadas
set DESKTOP_DIR=%USERPROFILE%\Desktop

echo Buscando navegador compatible para ejecucion nativa...
set BROWSER_EXE=

rem 1. Probar Microsoft Edge (Presente en el 100%% de Windows 10 y 11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_EXE="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    goto :found_browser
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_EXE="%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
    goto :found_browser
)

rem 2. Probar Google Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    goto :found_browser
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    goto :found_browser
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
    goto :found_browser
)

:found_browser
if "%BROWSER_EXE%"=="" (
    echo [!] No se encontro Edge ni Chrome. Creando acceso directo estandar...
    echo [InternetShortcut] > "%DESKTOP_DIR%\%APP_NAME%.url"
    echo URL=%APP_URL% >> "%DESKTOP_DIR%\%APP_NAME%.url"
    echo IconFile=%APP_URL%/favicon.ico >> "%DESKTOP_DIR%\%APP_NAME%.url"
    echo IconIndex=0 >> "%DESKTOP_DIR%\%APP_NAME%.url"
) else (
    echo [OK] Navegador optimizado detectado.
    echo Creando lanzador nativo de pantalla completa...

    set SCRIPT_DIR=%LOCALAPPDATA%\NovaSystemPOS
    if not exist "%SCRIPT_DIR%" mkdir "%SCRIPT_DIR%"

    echo @echo off > "%SCRIPT_DIR%\Iniciar-TPV.cmd"
    echo start "" %BROWSER_EXE% --app=%APP_URL% --window-size=1280,820 >> "%SCRIPT_DIR%\Iniciar-TPV.cmd"

    rem Crear acceso directo en el escritorio via VBScript
    set VBS_SCRIPT="%TEMP%\CreateShortcut.vbs"
    echo Set oWS = WScript.CreateObject("WScript.Shell") > %VBS_SCRIPT%
    echo sLinkFile = "%DESKTOP_DIR%\%APP_NAME%.lnk" >> %VBS_SCRIPT%
    echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %VBS_SCRIPT%
    echo oLink.TargetPath = %BROWSER_EXE% >> %VBS_SCRIPT%
    echo oLink.Arguments = "--app=%APP_URL% --window-size=1280,820" >> %VBS_SCRIPT%
    echo oLink.Description = "Punto de Venta POS, KDS y Facturacion - Dr. Empanadas C.A." >> %VBS_SCRIPT%
    echo oLink.Save >> %VBS_SCRIPT%
    cscript //nologo %VBS_SCRIPT%
    del %VBS_SCRIPT%
)

echo.
echo =====================================================================
echo  [LISTO] Se ha creado el icono en tu Escritorio:
echo         "%APP_NAME%"
echo.
echo  Ya puedes hacer doble clic en el acceso directo de tu escritorio
echo  para abrir NovaSystem TPV como aplicacion nativa.
echo =====================================================================
echo.
pause
