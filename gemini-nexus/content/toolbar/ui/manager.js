
(function() {
    // Dependencies
    const DOMBuilder = window.GeminiToolbarDOM;
    const View = window.GeminiToolbarView;
    const DragController = window.GeminiDragController;
    const Events = window.GeminiToolbarEvents;
    const GrammarManager = window.GeminiUIGrammar;
    const Renderer = window.GeminiUIRenderer;
    const ActionsDelegate = window.GeminiToolbarUIActions;
    
    // Localization helper
    const isZh = navigator.language.startsWith('zh');
    const DEFAULT_TITLE = isZh ? "询问" : "Ask";

    /**
     * Main UI Manager
     * Handles lifecycle, view orchestration, and public interface for the Controller.
     */
    class ToolbarUI {
        constructor() {
            this.host = null;
            this.shadow = null;
            this.view = null;
            this.dragController = null;
            this.events = null;
            this.domBuilder = new DOMBuilder();
            this.callbacks = {};
            this.isBuilt = false;
            
            // Sub-Managers
            this.grammarManager = null;
            this.bridge = null; // Renderer Bridge
            this.renderer = null;
            this.actionsDelegate = null;
        }

        setCallbacks(callbacks) {
            this.callbacks = callbacks;
        }

        build() {
            if (this.isBuilt) return;
            
            // Delegate DOM creation
            const { host, shadow } = this.domBuilder.create();
            this.host = host;
            this.shadow = shadow;
            
            // Initialize Sub-components
            this.view = new View(this.shadow);
            this.grammarManager = new GrammarManager(this.view);
            
            // Initialize Renderer Bridge (for background markdown rendering)
            this.bridge = new window.GeminiRendererBridge(this.host);

            // Initialize Renderer Logic
            this.renderer = new Renderer(this.view, this.bridge);
            
            // Init Actions Delegate
            this.actionsDelegate = new ActionsDelegate(this);

            // Init Drag Controller with Docking Logic
            this.dragController = new DragController(
                this.view.elements.askWindow, 
                this.view.elements.askHeader,
                {
                    onSnap: (side, top) => this.view.dockWindow(side, top),
                    onUndock: () => this.view.undockWindow()
                }
            );

            // Init Drag Controller for Floating Toolbar
            this.toolbarDragController = new DragController(
                this.view.elements.toolbar,
                this.view.elements.toolbarDrag,
                {
                    // No docking for small toolbar
                }
            );

            this.events = new Events(this);
            
            // Bind Events
            this.events.bind(this.view.elements, this.view.elements.askWindow);
            
            this.isBuilt = true;
        }

        // --- Event Handlers (Delegated) ---

        triggerAction(e, action) { this.actionsDelegate.triggerAction(e, action); }
        cancelAsk(e) { this.actionsDelegate.cancelAsk(e); }
        stopAsk(e) { this.actionsDelegate.stopAsk(e); }
        retryAsk(e) { this.actionsDelegate.retryAsk(e); }
        continueChat(e) { this.actionsDelegate.continueChat(e); }
        submitAsk(e) { this.actionsDelegate.submitAsk(e); }
        copyResult(e) { this.actionsDelegate.copyResult(e); }
        insertResult(e) { this.actionsDelegate.insertResult(e); }
        replaceResult(e) { this.actionsDelegate.replaceResult(e); }

        // --- Other Handlers ---

        handleImageClick() {
            this.fireCallback('onAction', 'image_analyze');
        }

        handleImageHover(isHovering) {
            this.fireCallback('onImageBtnHover', isHovering);
        }

        handleModelChange(model) {
            this.fireCallback('onModelChange', model);
        }

        handleCodeCopy(e) {
            const btn = e.target.closest('.copy-code-btn');
            if (!btn) return;
            
            const wrapper = btn.closest('.code-block-wrapper');
            const codeEl = wrapper.querySelector('code');
            if (!codeEl) return;
            
            const text = codeEl.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const originalHtml = btn.innerHTML;
                // Simple feedback (Icon change)
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied</span>`;
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                }, 2000);
            }).catch(err => console.error("Failed to copy text:", err));
        }

        saveWindowDimensions(w, h) {
            chrome.storage.local.set({ 'gemini_nexus_window_size': { w, h } });
        }

        fireCallback(type, ...args) {
            if (type === 'onImageBtnHover' && this.callbacks.onImageBtnHover) {
                this.callbacks.onImageBtnHover(...args);
            } else if (type === 'onModelChange' && this.callbacks.onModelChange) {
                this.callbacks.onModelChange(...args);
            } else if (this.callbacks.onAction) {
                this.callbacks.onAction(...args);
            }
        }

        // --- Public API ---

        show(rect, mousePoint) {
            this.view.showToolbar(rect, mousePoint);
        }

        hide() {
            this.view.hideToolbar();
        }

        hideAll() {
            this.hide();
            this.hideAskWindow();
            this.hideImageButton();
        }

        showImageButton(rect) {
            this.view.showImageButton(rect);
        }

        hideImageButton() {
            this.view.hideImageButton();
        }

        showAskWindow(rect, contextText, title = DEFAULT_TITLE, mousePoint = null) {
            return this.view.showAskWindow(rect, contextText, title, () => this.dragController.reset(), mousePoint);
        }

        showLoading(msg) {
            this.view.showLoading(msg);
        }

        stopLoading() {
            this.view.updateStreamingState(false);
            if (this.grammarManager) {
                this.grammarManager.updateResultActions(false);
            }
        }

        async showResult(text, title, isStreaming, images = []) {
            if (this.renderer) {
                await this.renderer.show(text, title, isStreaming, images);
            }
            
            // Update Grammar UI state
            if (this.grammarManager) {
                this.grammarManager.updateResultActions(isStreaming);
            }
        }

        handleGeneratedImageResult(request) {
            if (this.renderer) {
                this.renderer.handleGeneratedImageResult(request);
            }
        }

        showError(text) {
             this.view.showError(text);
        }

        hideAskWindow() {
            this.view.hideAskWindow();
            this.resetGrammarMode();
        }

        setInputValue(text) {
            this.view.setInputValue(text);
        }

        // --- Model Selection ---

        getSelectedModel() {
            return this.view ? this.view.getSelectedModel() : "gemini-2.5-flash";
        }

        setSelectedModel(model) {
            if (this.view) {
                this.view.setSelectedModel(model);
            }
        }

        // --- Grammar Mode Delegation ---

        setGrammarMode(enabled, sourceElement = null, selectionRange = null) {
            if (this.grammarManager) {
                this.grammarManager.setMode(enabled, sourceElement, selectionRange);
            }
        }

        resetGrammarMode() {
            if (this.grammarManager) {
                this.grammarManager.reset();
            }
        }

        showInsertReplaceButtons(show) {
            if (this.grammarManager) {
                this.grammarManager.toggleButtons(show);
            }
        }

        getSourceInfo() {
            return this.grammarManager ? this.grammarManager.getSourceInfo() : { element: null, range: null };
        }

        showGrammarButton(show) {
            if (this.grammarManager) {
                this.grammarManager.showTriggerButton(show);
            }
        }

        // --- Utils ---

        showCopySelectionFeedback(success) {
             this.view.toggleCopySelectionIcon(success);
             setTimeout(() => {
                 this.view.toggleCopySelectionIcon(null); 
             }, 2000);
        }

        isVisible() {
            if (!this.view) return false;
            return this.view.isToolbarVisible() || this.view.isWindowVisible();
        }

        isWindowVisible() {
            if (!this.view) return false;
            return this.view.isWindowVisible();
        }

        isHost(target) {
            if (!this.view) return false;
            return this.view.isHost(target, this.host);
        }
    }

    window.GeminiToolbarUI = ToolbarUI;

})();