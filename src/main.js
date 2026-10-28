const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

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
      { name: 'Dokümanlar ve medya', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'odt', 'ods', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt', 'md', 'html', 'htm', 'mp4', 'webm', 'mp3', 'wav'] },
      { name: 'Tüm dosyalar', extensions: ['*'] }
    ]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  return { url: pathToFileURL(p).href, ad: path.basename(p), yol: p };
});

ipcMain.handle('belge-oku', async (_e, dosyaYolu) => {
  if (typeof dosyaYolu !== 'string' || !path.isAbsolute(dosyaYolu)) {
    throw new Error('Geçersiz dosya yolu.');
  }
  const uzanti = path.extname(dosyaYolu).slice(1).toLowerCase();
  const izinli = ['docx', 'xlsx', 'xls', 'csv'];
  if (!izinli.includes(uzanti)) throw new Error('Bu belge biçimi uygulama içinde görüntülenemiyor.');
  const stat = fs.statSync(dosyaYolu);
  if (stat.size > 40 * 1024 * 1024) throw new Error('Dosya 40 MB sınırını aşıyor.');
  return { uzanti, base64: fs.readFileSync(dosyaYolu).toString('base64') };
});

ipcMain.handle('belge-ac', async (_e, dosyaYolu) => {
  if (typeof dosyaYolu !== 'string' || !path.isAbsolute(dosyaYolu)) {
    throw new Error('Geçersiz dosya yolu.');
  }
  return shell.openPath(dosyaYolu);
});

ipcMain.handle('not-kaydet', async (_e, metin, ad) => {
  const r = await dialog.showSaveDialog({
    defaultPath: (ad || 'not') + '.txt',
    filters: [{ name: 'Metin dosyası', extensions: ['txt'] }]
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, metin, 'utf8');
  return r.filePath;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
