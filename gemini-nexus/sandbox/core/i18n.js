
// sandbox/core/i18n.js

export const translations = {
    en: {
        "searchPlaceholder": "Search for chats",
        "recentLabel": "Recent",
        "noConversations": "No conversations found.",
        "settings": "Settings",
        "chatHistory": "Chat History",
        "newChat": "New Chat",
        "pageContext": "Page",
        "quote": "Quote",
        "ocr": "OCR",
        "snip": "Snip",
        "screenshotTranslate": "Translate",
        "uploadImage": "Upload Image",
        "askPlaceholder": "Ask Gemini...",
        "sendMessage": "Send message",
        "stopGenerating": "Stop generating",
        "settingsTitle": "Settings",
        "general": "General",
        "textSelection": "Text Selection Toolbar",
        "textSelectionDesc": "Show floating toolbar when selecting text.",
        "appearance": "Appearance",
        "theme": "Theme",
        "language": "Language",
        "keyboardShortcuts": "Keyboard Shortcuts",
        "shortcutDesc": "Click input and press keys to change.",
        "quickAsk": "Quick Ask (Floating)",
        "openSidePanel": "Open Side Panel",
        "openExtension": "Open Extension",
        "resetDefault": "Reset Default",
        "saveChanges": "Save Changes",
        "about": "About",
        "sourceCode": "Source Code",
        "system": "System Default",
        "light": "Light",
        "dark": "Dark",
        "pageContextActive": "Chat with page is already active",
        "pageContextEnabled": "Chat will include page content",
        "cancelled": "Cancelled.",
        "thinking": "Gemini is thinking...",
        "deleteChatConfirm": "Delete this chat?",
        "delete": "Delete",
        "imageSent": "Image sent",
        "selectOcr": "Select area for OCR...",
        "selectSnip": "Select area to capture...",
        "selectTranslate": "Select area to translate...",
        "processingImage": "Processing image...",
        "failedLoadImage": "Failed to load image.",
        "errorScreenshot": "Error processing screenshot.",
        "noTextSelected": "No text selected on page.",
        "ocrPrompt": "Please OCR this image. Extract the text content exactly as is, without any explanation.",
        "screenshotTranslatePrompt": "Please extract the text from this image and translate it into English. Output ONLY the translation.",
        "loadingImage": "Loading image...",
        
        // Tooltips
        "toggleHistory": "Chat History",
        "newChatTooltip": "New Chat",
        "pageContextTooltip": "Toggle chat with page content",
        "quoteTooltip": "Quote selected text from page",
        "ocrTooltip": "Capture area and extract text",
        "screenshotTranslateTooltip": "Capture area and translate text",
        "snipTooltip": "Capture area to input",
        "removeImage": "Remove image",
        "uploadImageTooltip": "Upload Image",
        "zoomOut": "Zoom Out",
        "zoomIn": "Zoom In",
        "resetZoom": "Fit to Screen",
        "downloadImage": "Download Image",
        "close": "Close",
        "sendMessageTooltip": "Send message",
        "openFullPageTooltip": "Open in full page"
    },
    zh: {
        "searchPlaceholder": "搜索对话",
        "recentLabel": "最近",
        "noConversations": "未找到对话。",
        "settings": "设置",
        "chatHistory": "历史记录",
        "newChat": "新对话",
        "pageContext": "网页",
        "quote": "引用",
        "ocr": "OCR",
        "snip": "截图",
        "screenshotTranslate": "截图翻译",
        "uploadImage": "上传图片",
        "askPlaceholder": "询问 Gemini...",
        "sendMessage": "发送消息",
        "stopGenerating": "停止生成",
        "settingsTitle": "设置",
        "general": "常规",
        "textSelection": "划词工具栏",
        "textSelectionDesc": "选中网页文本时显示悬浮工具栏。",
        "appearance": "外观",
        "theme": "主题",
        "language": "语言",
        "keyboardShortcuts": "快捷键",
        "shortcutDesc": "点击输入框并按下按键以修改。",
        "quickAsk": "快速提问 (悬浮)",
        "openSidePanel": "打开侧边栏",
        "openExtension": "打开扩展",
        "resetDefault": "恢复默认",
        "saveChanges": "保存更改",
        "about": "关于",
        "sourceCode": "源代码",
        "system": "跟随系统",
        "light": "浅色",
        "dark": "深色",
        "pageContextActive": "网页对话已激活",
        "pageContextEnabled": "对话将包含网页内容",
        "cancelled": "已取消",
        "thinking": "Gemini 正在思考...",
        "deleteChatConfirm": "确认删除此对话？",
        "delete": "删除",
        "imageSent": "图片已发送",
        "selectOcr": "请框选要识别的区域...",
        "selectSnip": "请框选要截图的区域...",
        "selectTranslate": "请框选要翻译的区域...",
        "processingImage": "正在处理图片...",
        "failedLoadImage": "图片加载失败。",
        "errorScreenshot": "截图处理出错。",
        "noTextSelected": "页面上未选择文本。",
        "ocrPrompt": "请识别并提取这张图片中的文字 (OCR)。仅输出识别到的文本内容，不需要任何解释。",
        "screenshotTranslatePrompt": "请识别这张图片中的文字并将其翻译成中文。仅输出翻译后的内容。",
        "loadingImage": "正在加载图片...",

        // Tooltips
        "toggleHistory": "历史记录",
        "newChatTooltip": "新对话",
        "pageContextTooltip": "切换网页上下文对话",
        "quoteTooltip": "引用网页选中内容",
        "ocrTooltip": "区域截图 (OCR文字提取)",
        "screenshotTranslateTooltip": "截取区域并翻译文字",
        "snipTooltip": "区域截图 (作为图片输入)",
        "removeImage": "移除图片",
        "uploadImageTooltip": "上传图片",
        "zoomOut": "缩小",
        "zoomIn": "放大",
        "resetZoom": "适应屏幕",
        "downloadImage": "下载图片",
        "close": "关闭",
        "sendMessageTooltip": "发送消息",
        "openFullPageTooltip": "新标签页打开"
    }
};

export function resolveLanguage(pref) {
    if (pref === 'system') {
        return navigator.language.startsWith('zh') ? 'zh' : 'en';
    }
    return pref;
}

let savedPreference = 'system';
let currentLang = resolveLanguage(savedPreference);

// Apply initial lang attribute for CSS/DOM consistency
try {
    document.documentElement.lang = currentLang;
} catch(e) {}

export function setLanguagePreference(pref) {
    savedPreference = pref;
    currentLang = resolveLanguage(pref);
    document.documentElement.lang = currentLang;
}

export function getLanguagePreference() {
    return savedPreference;
}

export function t(key) {
    return translations[currentLang][key] || key;
}

export function applyTranslations() {
    // 1. Text Content
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        if (text) el.textContent = text;
    });
    
    // 2. Placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = t(key);
        if (text) el.placeholder = text;
    });

    // 3. Titles (Tooltips)
    const titles = document.querySelectorAll('[data-i18n-title]');
    titles.forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const text = t(key);
        if (text) el.title = text;
    });
}
