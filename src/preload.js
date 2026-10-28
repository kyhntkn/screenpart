const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  dosyaSec: () => ipcRenderer.invoke('dosya-sec'),
  belgeDonustur: (url) => ipcRenderer.invoke('belge-donustur', url),
  notKaydet: (metin, ad) => ipcRenderer.invoke('not-kaydet', metin, ad)
});
