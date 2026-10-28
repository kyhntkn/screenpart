const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  dosyaSec: () => ipcRenderer.invoke('dosya-sec'),
  notKaydet: (metin, ad) => ipcRenderer.invoke('not-kaydet', metin, ad)
});
