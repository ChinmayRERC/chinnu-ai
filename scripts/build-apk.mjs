import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const bundled='/Applications/Android Studio.app/Contents/jbr/Contents/Home';
const java=process.env.JAVA_HOME??(existsSync(bundled)?bundled:undefined);
const sdk=process.env.ANDROID_HOME??`${process.env.HOME}/Library/Android/sdk`;
const result=spawnSync(process.platform==='win32'?'gradlew.bat':'./gradlew',['assembleDebug'],{cwd:new URL('../android',import.meta.url),stdio:'inherit',env:{...process.env,...(java?{JAVA_HOME:java}:{}),ANDROID_HOME:sdk}});
process.exit(result.status??1);
