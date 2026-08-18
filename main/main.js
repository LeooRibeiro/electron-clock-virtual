import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { registerNotificationHandler } from './notifications.js';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 560,
    autoHideMenuBar: true,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(import.meta.dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  registerNotificationHandler();
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