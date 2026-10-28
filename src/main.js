const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 700,
    minHeight: 480,
    backgroundColor: '#14161a',
    title: 'Ekran Bölücü',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

// Kutudaki sayfalarda yeni pencere açılırsa aynı kutuda aç
app.on('web-contents-created', (_e, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      contents.loadURL(url);
      return { action: 'deny' };
    });
  }
});

ipcMain.handle('dosya-sec', async () => {
  const r = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Dokümanlar ve medya', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt', 'md', 'html', 'htm', 'mp4', 'webm', 'mp3', 'wav'] },
      { name: 'Tüm dosyalar', extensions: ['*'] }
    ]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  return { url: pathToFileURL(p).href, ad: path.basename(p) };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
