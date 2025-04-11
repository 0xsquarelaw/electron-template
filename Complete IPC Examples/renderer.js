// This file runs in the renderer process and has access only to web APIs
// plus any APIs we've exposed via the preload script

/**
 * Set up event listeners after DOM is ready
 */
window.addEventListener('DOMContentLoaded', () => {
    // Display functions for demo purposes
    function displayMessage(message) {
      const messagesElement = document.getElementById('messages');
      const messageElement = document.createElement('div');
      messageElement.textContent = JSON.stringify(message);
      messagesElement.appendChild(messageElement);
    }
    
    // === SENDING ONE-WAY MESSAGES ===
    document.getElementById('send-button').addEventListener('click', () => {
      // Send a one-way message to main process
      window.electronAPI.send('to-main', {
        message: 'Hello from renderer!', 
        time: new Date().toISOString()
      });
      
      displayMessage('Message sent to main process');
    });
    
    // === REQUEST-RESPONSE PATTERN ===
    document.getElementById('request-button').addEventListener('click', async () => {
      try {
        // Make a request to main process and wait for response
        const response = await window.electronAPI.invoke('get-data', 'some-parameter');
        
        // Process the response
        displayMessage({
          type: 'response',
          data: response
        });
      } catch (error) {
        displayMessage({
          type: 'error',
          message: error.message
        });
      }
    });
    
    // === LISTENING FOR MESSAGES ===
    // Set up listener for messages from main process
    const cleanup = window.electronAPI.receive('from-main', (data) => {
      displayMessage({
        type: 'received',
        data: data
      });
    });
    
    // Optional: Remove the listener when no longer needed
    // For example, when navigating away or component unmounting
    document.getElementById('cleanup-button')?.addEventListener('click', () => {
      cleanup();
      displayMessage('Listener removed');
    });
  });