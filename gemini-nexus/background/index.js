
// background/index.js
import { GeminiSessionManager } from './session.js';
import { ImageHandler } from './image.js';
import { setupContextMenus } from './menus.js';
import { setupMessageListener } from './messages.js';
import { keepAliveManager } from '../services/keep_alive.js';

// Setup Sidepanel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Initialize Managers
const sessionManager = new GeminiSessionManager();
const imageHandler = new ImageHandler();

// Initialize Modules
setupContextMenus(imageHandler);
setupMessageListener(sessionManager, imageHandler);

// Initialize Advanced Keep-Alive (Cookie Rotation)
keepAliveManager.init();
