const { contextBridge, ipcRenderer } = require('electron');

/**
 * The preload script runs in a context that has access to both
 * the renderer DOM and Node.js/Electron APIs.
 * 
 * It serves as a secure bridge between the sandboxed renderer
 * and the main process.
 */

// Define valid channels for security - only these channels will be accessible
const validSendChannels = ['to-main'];
const validReceiveChannels = ['from-main'];
const validInvokeChannels = ['get-data'];

// Expose protected methods to renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Send a one-way message to the main process
   * @param {string} channel - The channel to send on
   * @param {any} data - The data to send
   */
  send: (channel, data) => {
    // Only allow whitelisted channels
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.error(`Unauthorized send attempt to channel: ${channel}`);
    }
  },
  
  /**
   * Call the main process and expect a response (Promise-based)
   * @param {string} channel - The channel to invoke on
   * @param {any} data - The data to send
   * @returns {Promise} - The response from the main process
   */
  invoke: (channel, data) => {
    // Only allow whitelisted channels
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    } else {
      console.error(`Unauthorized invoke attempt to channel: ${channel}`);
      return Promise.reject(new Error(`Unauthorized invoke to: ${channel}`));
    }
  },
  
  /**
   * Listen for messages from the main process
   * @param {string} channel - The channel to listen on
   * @param {Function} callback - The callback function
   * @returns {Function} - A function to remove the listener
   */
  receive: (channel, callback) => {
    // Only allow whitelisted channels
    if (validReceiveChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` which exposes IPC methods
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      
      // Return a function to clean up the listener
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    } else {
      console.error(`Unauthorized receive attempt on channel: ${channel}`);
      return () => {}; // Return dummy cleanup function
    }
  }
});