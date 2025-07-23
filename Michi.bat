@echo off
echo ================ Iniciando 'El Michi' ================
start cmd /k "python app.py"
timeout /t 3 >nul
start cmd /k ".\ngrok.exe http --domain=baruch.ngrok.app 5000"
pause
