
// background/session.js
import { sendGeminiMessage } from '../services/gemini_api.js';

export class GeminiSessionManager {
    constructor() {
        this.currentContext = null;
        this.lastModel = null;
        this.abortController = null;
        this.isInitialized = false;
    }

    async ensureInitialized() {
        if (this.isInitialized) return;
        
        try {
            const stored = await chrome.storage.local.get(['geminiContext', 'geminiModel']);
            if (stored.geminiContext) {
                this.currentContext = stored.geminiContext;
            }
            if (stored.geminiModel) {
                this.lastModel = stored.geminiModel;
            }
            this.isInitialized = true;
        } catch (e) {
            console.error("Failed to restore session:", e);
        }
    }

    async handleSendPrompt(request, onUpdate) {
        // Cancel previous if exists
        this.cancelCurrentRequest();
        
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            await this.ensureInitialized();

            // Reset context if model changed
            // Store target model in local var as we might switch it during fallback
            let targetModel = request.model;
            
            if (this.lastModel && this.lastModel !== targetModel) {
                this.currentContext = null;
            }
            // Note: We don't update this.lastModel yet; we wait for success.

            // Construct files array
            let files = [];
            // New multi-file support
            if (request.files && Array.isArray(request.files)) {
                files = request.files;
            } 
            // Backward compatibility for single image
            else if (request.image) {
                files = [{
                    base64: request.image, 
                    type: request.imageType,
                    name: request.imageName || "image.png"
                }];
            }

            // Send request with Fallback Logic
            let response;
            try {
                response = await sendGeminiMessage(
                    request.text, 
                    this.currentContext, 
                    targetModel, 
                    files, 
                    signal,
                    onUpdate // Pass stream callback
                );
            } catch (err) {
                // FALLBACK: If Thinking model (2.5-pro) fails with images (often "No valid response"), retry with Flash.
                // This handles cases where the experimental model doesn't support the image input format or tool.
                const isThinking = targetModel === 'gemini-2.5-pro';
                const hasFiles = files.length > 0;
                const isProtocolError = err.message && (err.message.includes("No valid response") || err.message.includes("400"));

                if (isThinking && hasFiles && isProtocolError) {
                    console.warn("[Gemini Nexus] Thinking model failed with image. Fallback to Flash.");
                    
                    // Prepare clean context for fallback (reuse auth, clear IDs)
                    let fallbackContext = null;
                    if (this.currentContext) {
                        fallbackContext = {
                            atValue: this.currentContext.atValue,
                            blValue: this.currentContext.blValue,
                            authUser: this.currentContext.authUser,
                            contextIds: ['', '', ''] 
                        };
                    }

                    targetModel = 'gemini-2.5-flash';
                    
                    response = await sendGeminiMessage(
                        request.text,
                        fallbackContext,
                        targetModel,
                        files,
                        signal,
                        onUpdate
                    );

                    // Append notification to the response text
                    const isZh = chrome.i18n.getUILanguage().startsWith('zh');
                    const note = isZh 
                        ? "\n\n*(注: 思考模型暂不支持此类图片输入，已自动切换为快速模型)*" 
                        : "\n\n*(Note: Thinking model does not support this image input. Switched to Fast model)*";
                    response.text += note;
                } else {
                    throw err; // Re-throw if not eligible for fallback
                }
            }
            
            // Update Context
            this.currentContext = response.newContext;
            this.lastModel = targetModel;
            
            // Persist
            await chrome.storage.local.set({ 
                geminiContext: this.currentContext,
                geminiModel: this.lastModel 
            });

            return {
                action: "GEMINI_REPLY",
                text: response.text,
                thoughts: response.thoughts,
                images: response.images, // Pass generated images
                status: "success",
                context: this.currentContext 
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Request aborted by user");
                return null; // Silent abort
            }

            console.error("Gemini Error:", error);
            
            let errorMessage = error.message || "Unknown error";
            const isZh = chrome.i18n.getUILanguage().startsWith('zh');

            // Handle Login Errors
            if(errorMessage.includes("未登录") || errorMessage.includes("Not logged in") || errorMessage.includes("Sign in")) {
                this.currentContext = null;
                await chrome.storage.local.remove(['geminiContext']);
                
                if (isZh) {
                    errorMessage = `未检测到登录状态或会话已过期。请前往 <a href="https://gemini.google.com" target="_blank" style="color: inherit; text-decoration: underline;">gemini.google.com</a> 登录账号后重试。`;
                } else {
                    errorMessage = `You are not logged in or session expired. Please log in at <a href="https://gemini.google.com" target="_blank" style="color: inherit; text-decoration: underline;">gemini.google.com</a> and try again.`;
                }

                // Return clean error message (UI handles styling)
                return {
                    action: "GEMINI_REPLY",
                    text: "Error: " + errorMessage, 
                    status: "error"
                };
            }
            
            if (errorMessage.includes("Failed to fetch")) {
                errorMessage = isZh 
                    ? "网络错误：无法连接到 Gemini。请检查您的网络连接。" 
                    : "Network error: Unable to connect to Gemini. Please check your internet connection.";
            }

            return {
                action: "GEMINI_REPLY",
                text: "Error: " + errorMessage,
                status: "error"
            };
        } finally {
            this.abortController = null;
        }
    }

    cancelCurrentRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            return true;
        }
        return false;
    }

    async setContext(context, model) {
        this.currentContext = context;
        this.lastModel = model;
        await chrome.storage.local.set({ 
            geminiContext: this.currentContext,
            geminiModel: this.lastModel 
        });
    }

    async resetContext() {
        this.currentContext = null;
        this.lastModel = null;
        await chrome.storage.local.remove(['geminiContext', 'geminiModel']);
    }
}
