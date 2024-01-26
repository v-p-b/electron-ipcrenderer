const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})

contextBridge.exposeInMainWorld("browserApi", {
    secureApi: callback => {
        ipcRenderer.on("testCommand", (event, args) => callback(args));
    },
    insecureApi: callback => {
        ipcRenderer.on("testCommand", callback);
    },
    trigger: callback => {
    },


})
