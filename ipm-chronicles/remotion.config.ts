import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setPublicDir(path.resolve(__dirname, 'public'));
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCrf(18);
Config.setChromiumOpenGlRenderer('angle');
Config.setBrowserExecutable('C:/Program Files/Google/Chrome/Application/chrome.exe');
