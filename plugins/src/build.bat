@ECHO OFF
ECHO Building...
@ECHO ON
call npx webpack
@ECHO OFF
ECHO Copying files
@ECHO ON
xcopy .. "D:\RPG Maker MV Projects\Galaxy Wars Terra\js\plugins" /Y /E /H
xcopy "D:\RPG Maker MV Projects\Galaxy Wars Terra\js\repository fork\SRW-Engine-MV-Plugins\plugins.js" "D:\RPG Maker MV Projects\Galaxy Wars Terra\js\" /Y
@ECHO OFF
pause