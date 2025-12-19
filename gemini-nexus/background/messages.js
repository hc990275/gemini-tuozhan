// background/messages.js
import { SessionMessageHandler } from './msg_session.js';
import { UIMessageHandler } from './msg_ui.js';

/**
 * Sets up the global runtime message listener.
 * @param {GeminiSessionManager} sessionManager 
 * @param {ImageHandler} imageHandler 
 */
export function setupMessageListener(sessionManager, imageHandler) {
    
    const sessionHandler = new SessionMessageHandler(sessionManager, imageHandler);
    const uiHandler = new UIMessageHandler(imageHandler);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        
        // Delegate to Session Handler (Prompt, Context, Quick Ask)
        if (sessionHandler.handle(request, sender, sendResponse)) {
            return true;
        }

        // Delegate to UI Handler (Image, Capture, Sidepanel)
        if (uiHandler.handle(request, sender, sendResponse)) {
            return true;
        }
        
        return false;
    });
}