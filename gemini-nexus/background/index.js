// background/index.js
import { GeminiSessionManager } from './session.js';
import { ImageHandler } from './image.js';
import { setupContextMenus } from './menus.js';
import { setupMessageListener } from './messages.js';

// Setup Sidepanel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Initialize Managers
const sessionManager = new GeminiSessionManager();
const imageHandler = new ImageHandler();

// Initialize Modules
setupContextMenus(imageHandler);
setupMessageListener(sessionManager, imageHandler);