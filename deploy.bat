@echo off
echo Preparing Manifest...
del frontend\cache.manifest
copy cache.manifest.template frontend\cache.manifest
echo. >> frontend\cache.manifest
echo. >> frontend\cache.manifest
echo # generated %DATE% %TIME% >> frontend\cache.manifest
echo.

echo Deploying...
appcfg.py --oauth2 update .
echo.

echo Deleting Manifest...
del frontend\cache.manifest
Echo.
pause