

// content_toolbar_templates.js
(function() {
    const ICONS = window.GeminiToolbarIcons;
    
    // Use the aggregated styles from content_toolbar_styles.js
    const STYLES = window.GeminiToolbarStyles || '';

    window.GeminiToolbarTemplates = {
        mainStructure: `
            <style>${STYLES}</style>
            
            <!-- Quick Actions Toolbar (Dark Theme) -->
            <div class="toolbar" id="toolbar">
                <button class="btn" id="btn-copy">${ICONS.COPY} Copy</button>
                <div class="divider"></div>
                <button class="btn" id="btn-ask">${ICONS.ASK} Ask</button>
                <div class="divider"></div>
                <button class="btn" id="btn-translate">${ICONS.TRANSLATE} Translate</button>
                <div class="divider"></div>
                <button class="btn" id="btn-explain">${ICONS.EXPLAIN} Explain</button>
            </div>

            <!-- Image Button -->
            <div class="image-btn" id="image-btn" title="Ask AI about this image">
                ${ICONS.IMAGE_EYE}
            </div>

            <!-- Main Ask Window (Light Theme, Resizable) -->
            <div class="ask-window" id="ask-window">
                <div class="ask-header" id="ask-header">
                    <span class="window-title" id="window-title">Gemini Nexus</span>
                    <div class="header-actions">
                        <button class="icon-btn" id="btn-header-close" title="Close">${ICONS.CLOSE}</button>
                    </div>
                </div>
                
                <div class="window-body">
                    <div class="input-container">
                        <input type="text" id="ask-input" placeholder="Ask Gemini..." autocomplete="off">
                    </div>
                    
                    <div class="context-preview hidden" id="context-preview"></div>
                    
                    <div class="result-area" id="result-area">
                        <div class="markdown-body" id="result-text"></div>
                        <div class="spinner-container hidden" id="loading-spinner">
                             <div class="spinner"></div>
                        </div>
                    </div>

                    <button class="copy-float-btn hidden" id="btn-copy-result" title="Copy">
                        ${ICONS.COPY}
                    </button>
                </div>

                <!-- Floating Footer Button -->
                <div class="footer-overlay hidden" id="footer-overlay">
                    <button class="stop-btn hidden" id="btn-stop-gen">
                        ${ICONS.STOP} 停止生成
                    </button>
                    <button class="continue-btn hidden" id="btn-continue-chat">
                        ${ICONS.CONTINUE} 继续对话
                    </button>
                </div>
            </div>
        `
    };
})();