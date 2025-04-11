## Key IPC Methods

**1. From Preload to Main:**

* `ipcRenderer.send(channel, ...args)` - One-way asynchronous communication. Sends a message to the main process without expecting a direct response.
* `ipcRenderer.invoke(channel, ...args)` - Request-response pattern. Sends a message to the main process and returns a Promise that resolves with the response.

**2. From Main to Renderer:**

* `webContents.send(channel, ...args)` - Sends a one-way asynchronous message to a specific renderer window.

**3. Listening:**

* `ipcMain.on(channel, handler)` - Listens for incoming messages on the specified `channel` in the main process. The `handler` function is executed when a message is received.
* `ipcMain.handle(channel, handler)` - Listens for `ipcRenderer.invoke` calls on the specified `channel` in the main process. The `handler` function should return a value or a Promise, which will be sent back as the response.
* `ipcRenderer.on(channel, handler)` - Listens for incoming messages on the specified `channel` in the preload script or a renderer process. The `handler` function is executed when a message is received.

### Security Best Practices

* Always use `contextIsolation: true` in the `webPreferences` of your `BrowserWindow`. This isolates the preload script and the renderer process from each other.
* Whitelist the channels that preload scripts are allowed to use for IPC communication. This prevents renderers from sending arbitrary messages to the main process.
* Validate all data passed through IPC on both the sending and receiving ends to prevent injection vulnerabilities.
* Use `contextBridge` in your preload script to selectively expose only the necessary APIs to the renderer process. This limits the attack surface.

This secure communication pattern ensures that renderers cannot directly access Node.js APIs while still allowing necessary and controlled communication between the renderer and main processes.

---
# ⬇️ Extra Theory Below ⬇️

### Modern Electron IPC Architecture

In current Electron applications, the secure communication pattern uses three components:

1. **Main Process**: Node.js process with full system access
2. **Preload Scripts**: Bridge scripts with access to Node.js APIs but run in renderer context
3. **Renderer Process**: Web content that runs in a sandboxed environment

Secure IPC Communication Flow
---
Preload Script as the Bridge
Preload scripts serve as the critical bridge between renderers and the main process. Direct IPC access from renderers is restricted for security reasons.
```Javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Safe methods for renderer to communicate with main process
  getData: () => ipcRenderer.invoke('get-data'),
  sendMessage: (message) => ipcRenderer.send('message-channel', message),
  onUpdate: (callback) => {
    ipcRenderer.on('update-channel', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('update-channel');
  }
});
```
Main Process Handling
---
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // Security: isolates renderer from Node.js
      nodeIntegration: false   // Security: prevents direct Node.js access
    }
  });

  // Handle IPC from renderer (via preload)
  ipcMain.handle('get-data', async () => {
    return { result: 'Data from main process' };
  });

  ipcMain.on('message-channel', (event, message) => {
    console.log('Message received:', message);
  });

  // Send message to renderer
  setTimeout(() => {
    mainWindow.webContents.send('update-channel', 'Update from main process');
  }, 3000);

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
```
Renderer Usage
---
```javascript
// In renderer (HTML or JS file)
window.addEventListener('DOMContentLoaded', () => {
  // Get data from main process
  window.electronAPI.getData().then(data => {
    console.log('Data received:', data);
  });

  // Send message to main process
  window.electronAPI.sendMessage('Hello from renderer');

  // Listen for updates from main process
  const cleanup = window.electronAPI.onUpdate(data => {
    console.log('Update received:', data);
  });

  // Later: cleanup();
});
```