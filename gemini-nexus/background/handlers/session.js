
// background/handlers/session.js
import { saveToHistory, appendAiMessage } from '../history.js';

export class SessionMessageHandler {
    constructor(sessionManager, imageHandler) {
        this.sessionManager = sessionManager;
        this.imageHandler = imageHandler;
    }

    handle(request, sender, sendResponse) {
        // --- PROMPT EXECUTION ---
        if (request.action === "SEND_PROMPT") {
            (async () => {
                const onUpdate = (partialText, partialThoughts) => {
                    // Catch errors if receiver (UI) is closed/unavailable
                    chrome.runtime.sendMessage({
                        action: "GEMINI_STREAM_UPDATE",
                        text: partialText,
                        thoughts: partialThoughts
                    }).catch(() => {}); 
                };

                try {
                    // Check if page context is requested
                    if (request.includePageContext) {
                         const pageContent = await this._getActiveTabContent();
                         if (pageContent) {
                             request.text = `Webpage Context:\n\`\`\`text\n${pageContent}\n\`\`\`\n\nQuestion: ${request.text}`;
                         }
                    }

                    const result = await this.sessionManager.handleSendPrompt(request, onUpdate);
                    if (result) {
                        // Robustness: Save to history in background to ensure persistence even if UI is closed
                        if (request.sessionId) {
                            await appendAiMessage(request.sessionId, result);
                        }

                        chrome.runtime.sendMessage(result).catch(() => {});
                    }
                } catch (e) {
                    console.error("Prompt error:", e);
                } finally {
                    sendResponse({ status: "completed" });
                }
            })();
            return true;
        }

        // --- QUICK ASK (CONTENT SCRIPT) ---
        if (request.action === "QUICK_ASK") {
            this._handleQuickAsk(request, sender).finally(() => {
                sendResponse({ status: "completed" });
            });
            return true;
        }

        // --- QUICK ASK IMAGE ---
        if (request.action === "QUICK_ASK_IMAGE") {
            this._handleQuickAskImage(request, sender).finally(() => {
                sendResponse({ status: "completed" });
            });
            return true;
        }

        // --- CONTROL ---
        if (request.action === "CANCEL_PROMPT") {
            const cancelled = this.sessionManager.cancelCurrentRequest();
            sendResponse({ status: cancelled ? "cancelled" : "no_active_request" });
            return false;
        }

        if (request.action === "SET_CONTEXT") {
            this.sessionManager.setContext(request.context, request.model)
                .then(() => sendResponse({status: "context_updated"}));
            return true;
        }

        if (request.action === "RESET_CONTEXT") {
            this.sessionManager.resetContext()
                .then(() => sendResponse({status: "reset"}));
            return true;
        }

        return false;
    }

    async _getActiveTabContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            if (!tab || !tab.id) return null;

            // Check for restricted URLs where content scripts/injection don't run
            if (tab.url && (
                tab.url.startsWith('chrome://') || 
                tab.url.startsWith('edge://') || 
                tab.url.startsWith('chrome-extension://') || 
                tab.url.startsWith('about:') ||
                tab.url.startsWith('view-source:') ||
                tab.url.startsWith('https://chrome.google.com/webstore') ||
                tab.url.startsWith('https://chromewebstore.google.com')
            )) {
                return null;
            }

            // Strategy 1: Try sending message to existing content script (Preferred)
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_CONTENT" });
                return response ? response.content : null;
            } catch (e) {
                // Strategy 2: Fallback to Scripting Injection (Robustness for unloaded scripts)
                // Useful if the tab was open before extension install or script context invalidated
                console.log("Content script unavailable, attempting fallback injection...");
                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            // Extract text content directly
                            return document.body ? document.body.innerText : "";
                        }
                    });
                    return results?.[0]?.result || null;
                } catch (injErr) {
                    console.error("Fallback injection failed:", injErr);
                    return null;
                }
            }
        } catch (e) {
            console.error("Failed to get page context:", e);
            return null;
        }
    }

    async _handleQuickAsk(request, sender) {
        const tabId = sender.tab ? sender.tab.id : null;
        
        // Ensure Quick Ask starts with a fresh context ONLY if it's a new conversation
        if (!request.sessionId) {
            await this.sessionManager.resetContext();
        } else {
            // Continuation of existing session - just ensure initialized
            await this.sessionManager.ensureInitialized();
        }

        const onUpdate = (partialText, partialThoughts) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
                    text: partialText,
                    thoughts: partialThoughts
                }).catch(() => {});
            }
        };

        const result = await this.sessionManager.handleSendPrompt(request, onUpdate);
        
        let savedSession = null;
        if (result && result.status === 'success') {
            savedSession = await saveToHistory(request.text, result, null);
        }

        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "GEMINI_STREAM_DONE",
                result: result,
                sessionId: savedSession ? savedSession.id : null
            }).catch(() => {});
        }
    }

    async _handleQuickAskImage(request, sender) {
        const tabId = sender.tab ? sender.tab.id : null;

        // 1. Fetch Image
        const imgRes = await this.imageHandler.fetchImage(request.url);
        
        if (imgRes.error) {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_DONE",
                    result: { status: "error", text: "Failed to load image: " + imgRes.error }
                }).catch(() => {});
            }
            return;
        }

        // 2. Construct Prompt (Pass as files array for session manager)
        const promptRequest = {
            text: request.text,
            model: request.model,
            files: [{
                base64: imgRes.base64,
                type: imgRes.type,
                name: imgRes.name
            }]
        };

        await this.sessionManager.resetContext();

        // 3. Execute
        const onUpdate = (partialText, partialThoughts) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
                    text: partialText,
                    thoughts: partialThoughts
                }).catch(() => {});
            }
        };

        const result = await this.sessionManager.handleSendPrompt(promptRequest, onUpdate);
        
        let savedSession = null;
        if (result && result.status === 'success') {
            // Save to history with the array format
            savedSession = await saveToHistory(request.text, result, [{ base64: imgRes.base64 }]);
        }

        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "GEMINI_STREAM_DONE",
                result: result,
                sessionId: savedSession ? savedSession.id : null
            }).catch(() => {});
        }
    }
}
