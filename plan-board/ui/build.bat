@echo off
rem Rebuilds the Plan Board UI into ..\dist
cd /d "%~dp0"
call npx pnpm install || exit /b 1
call npx pnpm run build || exit /b 1
echo Built to %~dp0..\dist
