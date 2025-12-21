




// content/toolbar/actions.js

class ToolbarActions {
    constructor(uiController) {
        this.ui = uiController;
        this.lastRequest = null;
    }

    // Helper to detect Chinese language preference
    isChinese() {
        return navigator.language && navigator.language.startsWith('zh');
    }

    // --- Business Logic ---

    /**
     * Handles Image Prompts (Screenshot, OCR, Analysis)
     * @param {string} imgBase64 - Image Data URL
     * @param {object} rect - Display Position
     * @param {string} mode - 'ocr' | 'translate' | 'snip' | 'analyze' | 'upscale' | 'remove_text' | 'remove_bg'
     * @param {string} model - Model Name
     */
    async handleImagePrompt(imgBase64, rect, mode, model = "gemini-2.5-flash") {
        const isZh = this.isChinese();
        let title, prompt, loadingMsg, inputVal;

        switch (mode) {
            case 'ocr':
                title = isZh ? "OCR 文字提取" : "OCR Extraction";
                prompt = isZh ? 
                    "请识别并提取这张图片中的文字 (OCR)。仅输出识别到的文本内容，不需要任何解释。" : 
                    "Please OCR this image. Extract the text content exactly as is, without any explanation.";
                loadingMsg = isZh ? "正在识别文字..." : "Extracting text...";
                inputVal = isZh ? "文字提取" : "OCR Extract";
                break;
            case 'translate':
                title = isZh ? "截图翻译" : "Image Translate";
                prompt = isZh ? 
                    "请识别这张图片中的文字并将其翻译成中文。仅输出翻译后的内容。" : 
                    "Please extract the text from this image and translate it into English. Output ONLY the translation.";
                loadingMsg = isZh ? "正在翻译..." : "Translating...";
                inputVal = isZh ? "截图翻译" : "Image Translate";
                break;
            case 'analyze': // General Image Analysis (from Hover button)
                title = isZh ? "图片分析" : "Image Analysis";
                prompt = isZh ? 
                    "请详细分析并描述这张图片的内容。" : 
                    "Please analyze and describe the content of this image in detail.";
                loadingMsg = isZh ? "正在分析图片内容..." : "Analyzing image content...";
                inputVal = isZh ? "分析图片内容" : "Analyze image";
                break;
            case 'upscale':
                title = isZh ? "画质提升" : "Upscale Image";
                prompt = isZh ? 
                    "请根据这张图片生成一个更高清晰度、更高分辨率的版本 (Upscale)。" : 
                    "Please generate a higher quality, higher resolution version of this image (Upscale).";
                loadingMsg = isZh ? "正在提升画质..." : "Upscaling...";
                inputVal = isZh ? "画质提升" : "Upscale";
                break;
            case 'remove_text':
                title = isZh ? "文字移除" : "Remove Text";
                prompt = isZh ? 
                    "请将这张图片中的所有文字移除，并填充背景，生成一张干净的图片。" : 
                    "Please remove all text from this image, inpaint the background, and generate the clean image.";
                loadingMsg = isZh ? "正在移除文字..." : "Removing text...";
                inputVal = isZh ? "文字移除" : "Remove Text";
                break;
            case 'remove_bg':
                title = isZh ? "背景移除" : "Remove Background";
                prompt = isZh ? 
                    "请移除这张图片的背景。生成一张带有透明背景的主体图片。" : 
                    "Please remove the background from this image. Generate a new image of the subject on a transparent background.";
                loadingMsg = isZh ? "正在移除背景..." : "Removing background...";
                inputVal = isZh ? "背景移除" : "Remove Background";
                break;
            case 'snip': // Fallback / Generic Snip
            default:
                title = isZh ? "截图分析" : "Snip Analysis";
                prompt = isZh ? 
                    "请详细描述这张截图的内容。" : 
                    "Please describe the content of this screenshot in detail.";
                loadingMsg = isZh ? "正在分析截图..." : "Analyzing snip...";
                inputVal = isZh ? "截图分析" : "Analyze Snip";
                break;
        }

        await this.ui.showAskWindow(rect, loadingMsg, title);
        this.ui.showLoading(loadingMsg);
        this.ui.setInputValue(inputVal);

        const msg = {
            action: "QUICK_ASK_IMAGE",
            url: imgBase64,
            text: prompt,
            model: model
        };
        
        this.lastRequest = msg;
        chrome.runtime.sendMessage(msg);
    }

    async handleQuickAction(actionType, selection, rect, model = "gemini-2.5-flash", mousePoint = null) {
        const prompt = this.getPrompt(actionType, selection);

        let title = this.isChinese() ? '解释' : 'Explain';
        let inputPlaceholder = this.isChinese() ? '解释选中内容' : 'Explain selected text';
        let loadingMsg = this.isChinese() ? '正在解释...' : 'Explaining...';

        if (actionType === 'translate') {
            title = this.isChinese() ? '翻译' : 'Translate';
            inputPlaceholder = this.isChinese() ? '翻译选中内容' : 'Translate selected text';
            loadingMsg = this.isChinese() ? '正在翻译...' : 'Translating...';
        } else if (actionType === 'summarize') {
            title = this.isChinese() ? '总结' : 'Summarize';
            inputPlaceholder = this.isChinese() ? '总结选中内容' : 'Summarize selected text';
            loadingMsg = this.isChinese() ? '正在总结...' : 'Summarizing...';
        } else if (actionType === 'grammar') {
            title = this.isChinese() ? '语法修正' : 'Fix Grammar';
            inputPlaceholder = this.isChinese() ? '修正语法' : 'Fixing grammar';
            loadingMsg = this.isChinese() ? '正在修正...' : 'Fixing grammar...';
        }

        this.ui.hide();
        await this.ui.showAskWindow(rect, selection, title, mousePoint);
        this.ui.showLoading(loadingMsg);

        this.ui.setInputValue(inputPlaceholder);

        const msg = {
            action: "QUICK_ASK",
            text: prompt,
            model: model
        };

        this.lastRequest = msg;
        chrome.runtime.sendMessage(msg);
    }

    handleSubmitAsk(question, context, sessionId = null, model = "gemini-2.5-flash") {
        this.ui.showLoading();
        
        let prompt = question;
        let includePageContext = false;

        if (context === "__PAGE_CONTEXT_FORCE__") {
            includePageContext = true;
            context = null; 
        }

        if (context) {
            prompt = `Context:\n${context}\n\nQuestion: ${question}`;
        }
        
        const msg = {
            action: "QUICK_ASK",
            text: prompt,
            model: model,
            sessionId: sessionId,
            includePageContext: includePageContext
        };
        
        this.lastRequest = msg;
        chrome.runtime.sendMessage(msg);
    }
    
    handleRetry() {
        if (!this.lastRequest) return;
        
        const currentModel = this.ui.getSelectedModel();
        if (currentModel) {
            this.lastRequest.model = currentModel;
        }
        
        const loadingMsg = this.isChinese() ? "正在重新生成..." : "Regenerating...";
        this.ui.showLoading(loadingMsg);
        chrome.runtime.sendMessage(this.lastRequest);
    }

    handleCancel() {
        chrome.runtime.sendMessage({ action: "CANCEL_PROMPT" });
    }

    handleContinueChat(sessionId) {
        chrome.runtime.sendMessage({ 
            action: "OPEN_SIDE_PANEL",
            sessionId: sessionId
        });
    }

    // --- Helpers ---

    getPrompt(action, payload) {
        if (this.isChinese()) {
            switch(action) {
                case 'translate':
                    return `将以下内容翻译成地道的中文（若原文非中文）或英文（若原文为中文）。请直接输出翻译后的文本，不要包含任何解释、前言或额外说明：\n\n"${payload}"`;
                case 'explain':
                    return `用通俗易懂的语言简要解释以下内容：\n\n"${payload}"`;
                case 'summarize':
                    return `请尽量简洁地总结以下内容：\n\n"${payload}"`;
                case 'grammar':
                    return `请修正以下文本的语法和拼写错误，保持原意不变。仅输出修正后的文本，不要添加任何解释：\n\n"${payload}"`;
                default:
                    return payload;
            }
        } else {
            // English Prompts
            switch(action) {
                case 'translate':
                    return `Translate the following text into natural English (if source is not English) or to the most likely target language (if source is English). Output ONLY the translation without any preamble or explanation:\n\n"${payload}"`;
                case 'explain':
                    return `Briefly explain the following text in simple language:\n\n"${payload}"`;
                case 'summarize':
                    return `Concise summary of the following text:\n\n"${payload}"`;
                case 'grammar':
                    return `Correct the grammar and spelling of the following text. Output ONLY the corrected text without any explanation:\n\n"${payload}"`;
                default:
                    return payload;
            }
        }
    }
}

// Export global for Content Script usage
window.GeminiToolbarActions = ToolbarActions;