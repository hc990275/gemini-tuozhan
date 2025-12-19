

// content_toolbar_view.js
(function() {
    /**
     * Main View Facade
     * Orchestrates WidgetView and WindowView
     */
    class ToolbarView {
        constructor(shadowRoot) {
            this.shadow = shadowRoot;
            this.elements = {};
            this.cacheElements();
            
            // Initialize Sub-Views
            this.widgetView = new window.GeminiViewWidget(this.elements);
            this.windowView = new window.GeminiViewWindow(this.elements);
        }

        cacheElements() {
            const get = (id) => this.shadow.getElementById(id);
            this.elements = {
                toolbar: get('toolbar'),
                imageBtn: get('image-btn'),
                
                // New Window Elements
                askWindow: get('ask-window'),
                askHeader: get('ask-header'),
                windowTitle: get('window-title'),
                contextPreview: get('context-preview'),
                askInput: get('ask-input'),
                resultArea: get('result-area'),
                resultText: get('result-text'),
                loadingSpinner: get('loading-spinner'),
                footerOverlay: get('footer-overlay'),
                
                // Buttons
                buttons: {
                    copySelection: get('btn-copy'),
                    ask: get('btn-ask'),
                    translate: get('btn-translate'),
                    explain: get('btn-explain'),
                    headerClose: get('btn-header-close'),
                    stop: get('btn-stop-gen'),
                    continue: get('btn-continue-chat'),
                    copy: get('btn-copy-result')
                }
            };
        }

        // --- Delegation to Widget View ---

        showToolbar(rect, mousePoint) { this.widgetView.showToolbar(rect, mousePoint); }
        hideToolbar() { this.widgetView.hideToolbar(); }
        showImageButton(rect) { this.widgetView.showImageButton(rect); }
        hideImageButton() { this.widgetView.hideImageButton(); }
        isToolbarVisible() { return this.widgetView.isToolbarVisible(); }
        toggleCopySelectionIcon(success) { this.widgetView.toggleCopySelectionIcon(success); }

        // --- Delegation to Window View ---

        get isPinned() { return this.windowView.isPinned; }
        
        togglePin() { return this.windowView.togglePin(); }
        showAskWindow(rect, contextText, title, resetDrag) { this.windowView.show(rect, contextText, title, resetDrag); }
        hideAskWindow() { this.windowView.hide(); }
        showLoading(msg) { this.windowView.showLoading(msg); }
        showResult(text, title, isStreaming) { this.windowView.showResult(text, title, isStreaming); }
        showError(text) { this.windowView.showError(text); }
        toggleCopyIcon(success) { this.windowView.toggleCopyIcon(success); }
        setInputValue(text) { this.windowView.setInputValue(text); }
        isWindowVisible() { return this.windowView.isVisible(); }

        // --- General ---

        isHost(target, host) {
            return target === host || this.windowView.isHost(target);
        }
    }

    window.GeminiToolbarView = ToolbarView;
})();