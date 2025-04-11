const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

/**
 * Creates the main application window with secure preload configuration
 */
function createWindow() {
  // Create the browser window with proper security settings
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Path to the preload script that will serve as our IPC bridge
      preload: path.join(__dirname, 'preload.js'),
      // Security: Isolates the renderer's JavaScript environment from the preload script
      contextIsolation: true,  
      // Security: Prevents renderer from accessing Node.js APIs directly
      nodeIntegration: false,  
      // Security: Prevents renderer from using remote module
      enableRemoteModule: false
    }
  });

  // Load the application's HTML file
  mainWindow.loadFile('index.html');

  // === RECEIVING MESSAGES FROM RENDERER (via preload) ===

  // One-way message handler - doesn't send a response back
  // Use for notifications, logs, or actions that don't need confirmation
  ipcMain.on('to-main', (event, data) => {
    console.log('Received in main process:', data);
    
    // You can identify which renderer sent the message using event.sender
    const webContents = event.sender;
    // Example: do something with the sender if needed
    // webContents.send('some-other-channel', 'Message received!');
  });

  // Two-way request-response handler (asynchronous)
  // Use for operations where the renderer needs a result
  ipcMain.handle('get-data', async (event, arg) => {
    console.log('Data requested with argument:', arg);
    
    // You can perform async operations here
    const result = await someAsyncOperation(arg);
    
    // The return value is sent back to the renderer
    return { 
      success: true, 
      data: result,
      requestedWith: arg
    };
  });

  // === SENDING MESSAGES TO RENDERER ===
  
  // Send a message to the renderer process after 3 seconds
  setTimeout(() => {
    // This sends to all renderers in this window
    mainWindow.webContents.send('from-main', {
      message: 'Hello from main process!',
      timestamp: Date.now()
    });
  }, 3000);
}

/**
 * Example async function to simulate database or API operation
 */
async function someAsyncOperation(arg) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(`Processed: ${arg}`);
    }, 1000);
  });
}

// Create window when Electron has finished initializing
app.whenReady().then(() => {
  createWindow();
  
  // macOS-specific behavior to recreate window when dock icon is clicked
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});