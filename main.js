const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  win.loadFile('index.html')
  win.webContents.on("will-navigate", (event, url) =>{
      event.preventDefault();
      win.webContents.send("testCommand", {foo: "bar"});
  });
}

app.whenReady().then(() => {
      createWindow()
})

