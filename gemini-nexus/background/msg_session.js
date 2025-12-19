// background/msg_session.js
import { saveToHistory } from './history.js';

export class SessionMessageHandler {
    constructor(sessionManager, imageHandler) {
        this.sessionManager = sessionManager;
        this.imageHandler = imageHandler;
    }

    handle(request, sender, sendResponse) {
        // --- PROMPT EXECUTION ---
        if (request.action === "SEND_PROMPT") {
            (async () => {
                const onUpdate = (partialText) => {
                    chrome.runtime.sendMessage({
                        action: "GEMINI_STREAM_UPDATE",
                        text: partialText
                    });
                };

                try {
                    // Check if page context is requested
                    if (request.includePageContext) {
                         const pageContent = await this._getActiveTabContent();
                         if (pageContent) {
                             request.text = `Context from current webpage:\n\`\`\`html\n${pageContent}\n\`\`\`\n\nUser Question: ${request.text}`;
                         }
                    }

                    const result = await this.sessionManager.handleSendPrompt(request, onUpdate);
                    if (result) {
                        chrome.runtime.sendMessage(result);
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
            if (!tab) return null;

            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_CONTENT" });
            return response ? response.content : null;
        } catch (e) {
            console.error("Failed to get page context:", e);
            return null;
        }
    }

    async _handleQuickAsk(request, sender) {
        const tabId = sender.tab ? sender.tab.id : null;
        
        // Ensure Quick Ask starts with a fresh context
        await this.sessionManager.resetContext();

        const onUpdate = (partialText) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
                    text: partialText
                });
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
            });
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
                });
            }
            return;
        }

        // 2. Construct Prompt
        const promptRequest = {
            text: request.text,
            model: request.model,
            image: imgRes.base64,
            imageType: imgRes.type,
            imageName: imgRes.name
        };

        await this.sessionManager.resetContext();

        // 3. Execute
        const onUpdate = (partialText) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
                    text: partialText
                });
            }
        };

        const result = await this.sessionManager.handleSendPrompt(promptRequest, onUpdate);
        
        let savedSession = null;
        if (result && result.status === 'success') {
            savedSession = await saveToHistory(request.text, result, { base64: imgRes.base64 });
        }

        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "GEMINI_STREAM_DONE",
                result: result,
                sessionId: savedSession ? savedSession.id : null
            });
        }
    }
}