const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  dosyaSec: () => ipcRenderer.invoke('dosya-sec')
});
