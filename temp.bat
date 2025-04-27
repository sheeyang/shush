@echo off
setlocal enabledelayedexpansion

set /a counter=1
set /a max_count=10

:loop
if !counter! leq !max_count! (
    echo {!counter!
    echo:
    set /a counter+=1
    ping -n 2 127.0.0.1 >nul
    goto loop
)

echo Done!