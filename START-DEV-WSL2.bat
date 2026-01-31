@echo off
echo ========================================
echo Iniciando servidor Next.js en WSL2
echo ========================================
echo.
echo Puerto interno WSL2: 3002
echo Puerto externo Windows: http://localhost:3000
echo.
echo IMPORTANTE: OAuth funciona en http://localhost:3000
echo (port forwarding configurado automaticamente)
echo ========================================
echo.

wsl -d Ubuntu bash -c "export NVM_DIR=$HOME/.nvm && [ -s $NVM_DIR/nvm.sh ] && . $NVM_DIR/nvm.sh && cd /mnt/c/Quoorum/apps/web && pnpm dev:no-fix"

pause
