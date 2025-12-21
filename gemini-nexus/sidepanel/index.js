
// sidepanel/index.js - Bridge between Sandbox and Background

const iframe = document.getElementById('sandbox-frame');
const skeleton = document.getElementById('skeleton');

// --- Optimization: 1. Instant Load (Sync) ---
// We use localStorage for Theme/Lang to avoid waiting for async chrome.storage
// This ensures the iframe request starts in the very same Event Loop tick.
const cachedTheme = localStorage.getItem('geminiTheme') || 'system';
const cachedLang = localStorage.getItem('geminiLanguage') || 'system';

// Set src immediately to start loading HTML (Parallel with storage fetch)
iframe.src = `../sandbox.html?theme=${cachedTheme}&lang=${cachedLang}`;


// --- Optimization: 2. Async Data Fetch ---
let preFetchedData = null;
let uiIsReady = false;

// Start fetching bulk data (sessions) immediately
chrome.storage.local.get([
    'geminiSessions', 
    'pendingSessionId', 
    'geminiShortcuts',
    'geminiModel',
    'pendingImage'
], (result) => {
    preFetchedData = result;
    trySendInitData();
});

// --- Helper: Send Data when both UI and Data are ready ---
function trySendInitData() {
    if (!uiIsReady && !iframe.contentWindow) return; // Allow if contentWindow exists for forced load

    // 1. Reveal Iframe
    iframe.classList.add('loaded');
    if (skeleton) skeleton.classList.add('hidden');

    const win = iframe.contentWindow;
    if (!win) return;
    
    // 2. Push Data (if ready)
    if (preFetchedData) {
        // Push Sessions
        win.postMessage({
            action: 'RESTORE_SESSIONS',
            payload: preFetchedData.geminiSessions || []
        }, '*');

        // Push Shortcuts
        win.postMessage({
            action: 'RESTORE_SHORTCUTS',
            payload: preFetchedData.geminiShortcuts || null
        }, '*');

        // Push Model
        win.postMessage({
            action: 'RESTORE_MODEL',
            payload: preFetchedData.geminiModel || 'gemini-2.5-flash'
        }, '*');

        // Handle Pending Session Switch
        if (preFetchedData.pendingSessionId) {
            win.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: {
                    action: 'SWITCH_SESSION',
                    sessionId: preFetchedData.pendingSessionId
                }
            }, '*');
            // Cleanup
            chrome.storage.local.remove('pendingSessionId');
            delete preFetchedData.pendingSessionId;
        }

        // Handle Pending Image (Screenshot)
        if (preFetchedData.pendingImage) {
            win.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: preFetchedData.pendingImage
            }, '*');
            chrome.storage.local.remove('pendingImage');
            delete preFetchedData.pendingImage;
        }
    }

    // Push Language (Confirming storage value)
    win.postMessage({
        action: 'RESTORE_LANGUAGE',
        payload: cachedLang
    }, '*');

    // Push Theme (Confirming storage value)
    win.postMessage({
        action: 'RESTORE_THEME',
        payload: cachedTheme
    }, '*');
}

// --- Safety Timeout ---
// Force remove skeleton after 1s if something goes wrong with the handshake
setTimeout(() => {
    if (!uiIsReady) {
        console.warn("UI_READY signal timeout, forcing skeleton removal");
        iframe.classList.add('loaded');
        if (skeleton) skeleton.classList.add('hidden');
    }
}, 1000);

// --- Message Handling ---

window.addEventListener('message', (event) => {
    // Only accept messages from our direct iframe
    if (iframe.contentWindow && event.source !== iframe.contentWindow) return;

    const { action, payload } = event.data;

    // --- Fast Handshake: UI Ready ---
    // The sandbox sends this as soon as JS modules load
    if (action === 'UI_READY') {
        uiIsReady = true;
        trySendInitData();
        return;
    }
    
    // --- Open Full Page in New Tab ---
    if (action === 'OPEN_FULL_PAGE') {
        const url = chrome.runtime.getURL('sidepanel/index.html');
        chrome.tabs.create({ url });
        return;
    }
    
    // --- Standard Message Forwarding ---
    
    if (action === 'FORWARD_TO_BACKGROUND') {
        chrome.runtime.sendMessage(payload).catch(() => {});
    }
    
    // --- Data Requests from Sandbox ---

    if (action === 'DOWNLOAD_IMAGE') {
        const { url, filename } = payload;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
    }

    if (action === 'GET_THEME') {
        const theme = localStorage.getItem('geminiTheme') || 'system';
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                action: 'RESTORE_THEME',
                payload: theme
            }, '*');
        }
    }

    if (action === 'GET_LANGUAGE') {
        const lang = localStorage.getItem('geminiLanguage') || 'system';
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                action: 'RESTORE_LANGUAGE',
                payload: lang
            }, '*');
        }
    }
    
    if (action === 'GET_TEXT_SELECTION') {
        chrome.storage.local.get(['geminiTextSelectionEnabled'], (res) => {
            const enabled = res.geminiTextSelectionEnabled !== false; // Default true
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    action: 'RESTORE_TEXT_SELECTION',
                    payload: enabled
                }, '*');
            }
        });
    }

    // --- Sync Storage Updates back to Local Cache (For Speed next time) ---
    
    if (action === 'SAVE_SESSIONS') {
        chrome.storage.local.set({ geminiSessions: payload });
        if(preFetchedData) preFetchedData.geminiSessions = payload;
    }
    if (action === 'SAVE_SHORTCUTS') {
        chrome.storage.local.set({ geminiShortcuts: payload });
        if(preFetchedData) preFetchedData.geminiShortcuts = payload;
    }
    if (action === 'SAVE_MODEL') {
        chrome.storage.local.set({ geminiModel: payload });
        if(preFetchedData) preFetchedData.geminiModel = payload;
    }
    if (action === 'SAVE_THEME') {
        chrome.storage.local.set({ geminiTheme: payload });
        localStorage.setItem('geminiTheme', payload); // Cache for Sync Load
    }
    if (action === 'SAVE_LANGUAGE') {
        chrome.storage.local.set({ geminiLanguage: payload });
        localStorage.setItem('geminiLanguage', payload); // Cache for Sync Load
    }
    if (action === 'SAVE_TEXT_SELECTION') {
        chrome.storage.local.set({ geminiTextSelectionEnabled: payload });
    }
});

// Forward messages from Background to Sandbox
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'SESSIONS_UPDATED') {
        if(preFetchedData) preFetchedData.geminiSessions = message.sessions;
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                action: 'RESTORE_SESSIONS',
                payload: message.sessions
            }, '*');
        }
        return;
    }

    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            action: 'BACKGROUND_MESSAGE',
            payload: message
        }, '*');
    }
});
