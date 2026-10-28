const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  dosyaSec: () => ipcRenderer.invoke('dosya-sec'),
  belgeAc: (dosyaYolu) => ipcRenderer.invoke('belge-ac', dosyaYolu),
  notKaydet: (metin, ad) => ipcRenderer.invoke('not-kaydet', metin, ad)
});
