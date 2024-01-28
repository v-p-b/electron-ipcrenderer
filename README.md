Electron Security - ipcRenderer.on() Misuse Demo
================================================

This is a demo app to experiment with the insecure use of Electron's ipcRenderer.on() in the preload script. 

As of this writing the official [documentation](https://www.electronjs.org/docs/latest/tutorial/ipc#2-expose-ipcrendereron-via-preload) states this:

> Security warning
> We don't directly expose the whole ipcRenderer.on API for security reasons. Make sure to limit the renderer's access to Electron APIs as much as possible. Also don't just pass the callback to ipcRenderer.on as this will leak ipcRenderer via event.sender. Use a custom handler that invoke the callback only with the desired arguments.

The following *secure* code example is provided:

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
      onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value))
})
```

The relevant part of this code is that the `_event` object is not passed to the `callback` function, so `callback` won't have a reference to the `ipcRenderer` object via `_event.sender`.

Now let's see how does the *insecure* pattern look like, that "just passes" the callback:

```js
contextBridge.exposeInMainWorld('electronAPI', {
      onUpdateCounter: (callback) => ipcRenderer.on('update-counter', callback)
})
```

It seems that this anti-pattern is in fact [in use](https://www.reddit.com/r/electronjs/comments/13mcc3v/main_renderer_communication_help_me_understand/), but how can this be exploited?

In the provided app we can confirm access to `ipcRenderer` by invoking the following code from the renderer (you can paste this after opening DevTools with Ctrl+Shift+I):

```js
window.browserApi.insecureApi(
  (event,args) => {
      console.log(event);
      event.sender.sendSync("ELECTRON_BROWSER_REQUIRE",{});
      }
);
```

However, in the latest Electron version (28.x as of this writing) this results in the following error message being logged to the console:

```
WebContents #1 called ipcRenderer.sendSync() with 'ELECTRON_BROWSER_REQUIRE' channel without listeners.
```

Impact Analysis
---------------

It seems, that the internal IPC channels used in [previous](https://github.com/illikainen/exploits/blob/master/nightmare-ipc/exploit.py) [exploits](https://blog.doyensec.com/2019/04/03/subverting-electron-apps-via-insecure-preload.html) are no longer present. 

This is _likely_ the result of [separating](https://github.com/electron/electron/pull/13940) internal IPC channels from the ones available for developers. I couldn't bisect the Electron versions where both ContextBrige based IPC and abusable internal channels are present.

Some [writeups](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/electron-desktop-apps/electron-contextisolation-rce-via-ipc) suggest that one may still be able to make unexpected calls to IPC channels defined by application developers, however these channels are by definition meant to be called from the Renderer, and are exposed to any attacker who can execute code there (e.g. via XSS) anyway, without relying on insecure preloads. 


