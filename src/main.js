const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { fileURLToPath } = require('url');

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
      { name: 'Dokümanlar ve medya', extensions: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt', 'md', 'html', 'htm', 'mp4', 'webm', 'mp3', 'wav'] },
      { name: 'Tüm dosyalar', extensions: ['*'] }
    ]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  return { url: pathToFileURL(p).href, ad: path.basename(p) };
});

const BELGE_STIL = `
  body{font-family:Calibri,"Segoe UI",sans-serif;background:#fff;color:#111;margin:0;padding:20px;line-height:1.5}
  img{max-width:100%;height:auto}
  .kap{overflow:auto}
  table{border-collapse:collapse}
  td,th{border:1px solid #c8c8c8;padding:3px 8px;vertical-align:top}
  .sek{position:sticky;top:0;background:#f1f3f4;padding:6px;margin:-20px -20px 12px;display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid #ccc}
  .sek button{border:1px solid #bbb;background:#fff;border-radius:6px;padding:4px 10px;cursor:pointer}
  .sek button.on{background:#3ea6ff;border-color:#3ea6ff;color:#fff}
`;
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

ipcMain.handle('belge-donustur', async (_e, fileUrl) => {
  try {
    const p = fileURLToPath(fileUrl);
    const ext = path.extname(p).toLowerCase();
    let govde;
    if (ext === '.doc') {
      return { hata: 'Eski .doc biçimi desteklenmiyor. Word\'de .docx olarak kaydedip tekrar dene.' };
    } else if (ext === '.docx') {
      const mammoth = require('mammoth');
      const r = await mammoth.convertToHtml({ path: p });
      govde = '<div class="kap" style="max-width:850px;margin:auto">' + r.value + '</div>';
    } else {
      const XLSX = require('xlsx');
      const wb = XLSX.readFile(p, { codepage: 65001, cellDates: true });
      const adlar = wb.SheetNames;
      const tablolar = adlar.map((ad, i) => {
        const html = XLSX.utils.sheet_to_html(wb.Sheets[ad], { header: '', footer: '' });
        const t = (html.match(/<table[\s\S]*<\/table>/i) || [html])[0];
        return '<div class="kap sayfa" data-i="' + i + '"' + (i ? ' hidden' : '') + '>' + t + '</div>';
      });
      const sek = adlar.length > 1
        ? '<div class="sek">' + adlar.map((ad, i) => '<button data-i="' + i + '" class="' + (i ? '' : 'on') + '">' + esc(ad) + '</button>').join('') + '</div>'
        : '';
      const js = '<script>document.querySelectorAll(".sek button").forEach(function(b){b.onclick=function(){document.querySelectorAll(".sek button").forEach(function(x){x.classList.toggle("on",x===b)});document.querySelectorAll(".sayfa").forEach(function(s){s.hidden=s.dataset.i!==b.dataset.i})}})</script>';
      govde = sek + tablolar.join('') + js;
    }
    const doc = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + BELGE_STIL + '</style></head><body>' + govde + '</body></html>';
    const mt = fs.statSync(p).mtimeMs;
    const ad = 'ekran-bolucu-' + crypto.createHash('md5').update(p + mt).digest('hex') + '.html';
    const hedef = path.join(os.tmpdir(), ad);
    fs.writeFileSync(hedef, doc, 'utf8');
    return { url: pathToFileURL(hedef).href };
  } catch (err) {
    return { hata: 'Belge açılamadı: ' + err.message };
  }
});

ipcMain.handle('dosya-goster', (_e, fileUrl) => {
  shell.showItemInFolder(fileURLToPath(fileUrl));
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
