@echo off
chcp 65001 > nul
title KSNB Live Auto-Sync Server
echo ===================================================================
echo [KSNB AUTOMATION] DANG KHOI CHAY SERVER TU DONG LUU...
echo Dia chi web: http://127.0.0.1:8765
echo Khi sua tren web, he thong se tu dong luu truc tiep ve file code!
echo ===================================================================
cd /d "d:\CHƯƠNG TRÌNH PYTHON\GIBHUB TÀI LIỆU\Tho_DMX"
python live_sync_server.py
pause
