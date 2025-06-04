@echo off
setlocal enabledelayedexpansion

for /L %%i in (0,10,100) do (
    set /p="Progress: %%i%%%" <nul
    <nul set /p=[100D
    timeout /nobreak /t 1 >nul
)
echo.
