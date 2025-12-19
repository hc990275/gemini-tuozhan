// background/msg_ui.js

export class UIMessageHandler {
    constructor(imageHandler) {
        this.imageHandler = imageHandler;
    }

    handle(request, sender, sendResponse) {
        
        // --- IMAGE FETCHING ---
        if (request.action === "FETCH_IMAGE") {
            (async () => {
                try {
                    const result = await this.imageHandler.fetchImage(request.url);
                    chrome.runtime.sendMessage(result);
                } catch (e) {
                    console.error("Fetch image error", e);
                } finally {
                    sendResponse({ status: "completed" });
                }
            })();
            return true;
        }

        if (request.action === "CAPTURE_SCREENSHOT") {
            (async () => {
                try {
                    const result = await this.imageHandler.captureScreenshot();
                    chrome.runtime.sendMessage(result);
                } catch(e) {
                     console.error("Screenshot error", e);
                } finally {
                    sendResponse({ status: "completed" });
                }
            })();
            return true;
        }

        // --- SIDEPANEL & SELECTION ---

        if (request.action === "OPEN_SIDE_PANEL") {
            this._handleOpenSidePanel(request, sender).finally(() => {
                 sendResponse({ status: "opened" });
            });
            // We don't necessarily need to return true unless we sendResponse, 
            // but keeping channel open is safe.
            return true; 
        }

        if (request.action === "INITIATE_CAPTURE") {
            (async () => {
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                if (tab) {
                    chrome.tabs.sendMessage(tab.id, { action: "START_SELECTION" });
                }
            })();
            return false;
        }

        if (request.action === "AREA_SELECTED") {
            (async () => {
                try {
                    const result = await this.imageHandler.captureArea(request.area);
                    if (result) {
                        chrome.runtime.sendMessage(result);
                    }
                } catch (e) {
                    console.error("Area capture error", e);
                } finally {
                    sendResponse({ status: "completed" });
                }
            })();
            return true;
        }

        if (request.action === "GET_ACTIVE_SELECTION") {
            (async () => {
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                if (tab) {
                    try {
                        const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_SELECTION" });
                        chrome.runtime.sendMessage({
                            action: "SELECTION_RESULT",
                            text: response ? response.selection : ""
                        });
                    } catch (e) {
                        chrome.runtime.sendMessage({ action: "SELECTION_RESULT", text: "" });
                    }
                }
                sendResponse({ status: "completed" });
            })();
            return true;
        }

        return false;
    }

    async _handleOpenSidePanel(request, sender) {
        if (sender.tab) {
            // Call open() immediately
            const openPromise = chrome.sidePanel.open({ tabId: sender.tab.id, windowId: sender.tab.windowId })
                .catch(err => console.error("Could not open side panel:", err));

            // Store pending session if needed
            if (request.sessionId) {
                await chrome.storage.local.set({ pendingSessionId: request.sessionId });
                setTimeout(() => chrome.storage.local.remove('pendingSessionId'), 5000);
            }

            try { await openPromise; } catch (e) {}

            // Notify opened panel
            if (request.sessionId) {
                setTimeout(() => {
                    chrome.runtime.sendMessage({
                        action: "SWITCH_SESSION",
                        sessionId: request.sessionId
                    });
                }, 500);
            }
        }
    }
}