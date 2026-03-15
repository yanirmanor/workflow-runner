import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { copyFileSync, chmodSync, existsSync } from 'node:fs';
import started from 'electron-squirrel-startup';
import { registerIpcHandlers } from './ipc-handlers';

if (started) {
  app.quit();
}

function installCli() {
  try {
    const cliBinary = path.join(process.resourcesPath, 'workflow');
    if (!existsSync(cliBinary)) return;
    const dest = '/usr/local/bin/workflow';
    copyFileSync(cliBinary, dest);
    chmodSync(dest, 0o755);
  } catch {
    // /usr/local/bin may not be writable — skip silently
  }
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  registerIpcHandlers(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.on('ready', () => {
  installCli();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
