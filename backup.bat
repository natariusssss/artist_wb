@echo off
chcp 65001 >nul
setlocal

REM ============================================
REM   Резервное копирование artist_wb
REM ============================================

REM Пути проекта (при необходимости поменяйте)
set "PROJECT_DIR=C:\Users\natag\PycharmProjects\artist_wb"
set "SERVER_DIR=%PROJECT_DIR%\server"

REM Куда складывать бэкапы
set "BACKUP_ROOT=C:\Backups\artist_wb"

REM Дата и время для имени папки
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (
    set "DD=%%a"
    set "MM=%%b"
    set "YYYY=%%c"
)
for /f "tokens=1-2 delims=:." %%a in ('echo %time%') do (
    set "HH=%%a"
    set "MIN=%%b"
)

set "STAMP=%YYYY%-%MM%-%DD%_%HH%-%MIN%"
set "BACKUP_DIR=%BACKUP_ROOT%\%STAMP%"

echo.
echo ============================================
echo   Резервное копирование artist_wb
echo ============================================
echo   Источник: %SERVER_DIR%
echo   Куда:     %BACKUP_DIR%
echo ============================================
echo.

REM Создаём папку для бэкапа
if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"
mkdir "%BACKUP_DIR%"

REM --- 1. Копируем БД ---
if exist "%SERVER_DIR%\data.sqlite" (
    copy /Y "%SERVER_DIR%\data.sqlite" "%BACKUP_DIR%\data.sqlite" >nul
    echo [OK] data.sqlite скопирован
) else (
    echo [!!] data.sqlite не найден — пропущено
)

REM --- 2. Копируем .env (секреты) ---
if exist "%SERVER_DIR%\.env" (
    copy /Y "%SERVER_DIR%\.env" "%BACKUP_DIR%\.env" >nul
    echo [OK] .env скопирован
) else (
    echo [!!] .env не найден — пропущено
)

REM --- 3. Копируем uploads (картинки) ---
if exist "%SERVER_DIR%\uploads" (
    xcopy "%SERVER_DIR%\uploads" "%BACKUP_DIR%\uploads\" /E /I /Y /Q >nul
    echo [OK] uploads скопирован
) else (
    echo [!!] uploads не найден — пропущено
)

REM --- 4. Удаляем старые бэкапы (старше 30 дней) ---
echo.
echo Удаляю бэкапы старше 30 дней...
forfiles /P "%BACKUP_ROOT%" /D -30 /C "cmd /c if @isdir==TRUE rmdir /S /Q @path" 2>nul

echo.
echo ============================================
echo   Готово!
echo   Файлы: %BACKUP_DIR%
echo ============================================
echo.

endlocal
pause