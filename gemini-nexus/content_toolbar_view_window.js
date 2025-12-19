
// content_toolbar_view_window.js
(function() {
    const Utils = window.GeminiViewUtils;
    const MarkdownRenderer = window.GeminiMarkdownRenderer;
    const ICONS = window.GeminiToolbarIcons;

    /**
     * Sub-controller for the Ask Window
     */
    class WindowView {
        constructor(elements) {
            this.elements = elements;
            this.isPinned = false;
        }

        togglePin() {
            this.isPinned = !this.isPinned;
            return this.isPinned;
        }

        async show(rect, contextText, title, resetDrag = null) {
            if (!this.elements.askWindow) return;

            // Load and apply saved dimensions
            const stored = await chrome.storage.local.get('gemini_nexus_window_size');
            if (stored.gemini_nexus_window_size) {
                let { w, h } = stored.gemini_nexus_window_size;
                
                // Clamp to viewport
                const maxW = window.innerWidth * 0.95; 
                const maxH = window.innerHeight * 0.95;

                if (w > maxW) w = maxW;
                if (h > maxH) h = maxH;
                
                this.elements.askWindow.style.width = `${w}px`;
                this.elements.askWindow.style.height = `${h}px`;
            }

            if (resetDrag && !this.isPinned) {
                 // Reset position only if not pinned
                 resetDrag();
                 Utils.positionElement(this.elements.askWindow, rect, true, this.isPinned);
            } else if (!this.elements.askWindow.classList.contains('visible')) {
                 // First open
                 if (resetDrag) resetDrag();
                 Utils.positionElement(this.elements.askWindow, rect, true, this.isPinned);
            }
            
            // Reset Content
            this.elements.windowTitle.textContent = title || "询问";
            if (contextText) {
                this.elements.contextPreview.textContent = contextText;
                this.elements.contextPreview.classList.remove('hidden');
            } else {
                this.elements.contextPreview.classList.add('hidden');
            }
            
            this.elements.askInput.value = '';
            this.elements.resultText.innerHTML = '';
            this.elements.loadingSpinner.classList.add('hidden');
            this.elements.footerOverlay.classList.add('hidden');
            if (this.elements.buttons.copy) this.elements.buttons.copy.classList.add('hidden');
            if (this.elements.buttons.continue) this.elements.buttons.continue.classList.add('hidden');

            this.elements.askWindow.classList.add('visible');
            
            setTimeout(() => this.elements.askInput.focus(), 50);
        }

        hide() {
            if (this.elements.askWindow) this.elements.askWindow.classList.remove('visible');
        }

        showLoading(msg = "Gemini is thinking...") {
            if (!this.elements.askWindow) return;
            this.elements.resultText.innerHTML = ''; // Clear previous
            this.elements.loadingSpinner.classList.remove('hidden');
            
            // Show Footer with Stop button, hide Continue
            this.elements.footerOverlay.classList.remove('hidden');
            if (this.elements.buttons.stop) this.elements.buttons.stop.classList.remove('hidden');
            if (this.elements.buttons.continue) this.elements.buttons.continue.classList.add('hidden');
            
            if (this.elements.buttons.copy) this.elements.buttons.copy.classList.add('hidden');
        }

        showResult(text, title, isStreaming = false) {
            if (!this.elements.askWindow) return;
            
            if (title) this.elements.windowTitle.textContent = title;
            
            // Smart Scroll Logic
            const resultArea = this.elements.resultArea;
            let shouldScrollBottom = false;
            if (resultArea) {
                const threshold = 50;
                const distanceToBottom = resultArea.scrollHeight - resultArea.scrollTop - resultArea.clientHeight;
                shouldScrollBottom = distanceToBottom <= threshold;
            }
            
            this.elements.resultText.innerHTML = MarkdownRenderer.render(text);
            
            if (isStreaming) {
                // Streaming: Show Spinner, Show Stop, Hide Continue/Copy
                this.elements.loadingSpinner.classList.remove('hidden');
                
                this.elements.footerOverlay.classList.remove('hidden');
                if (this.elements.buttons.stop) this.elements.buttons.stop.classList.remove('hidden');
                if (this.elements.buttons.continue) this.elements.buttons.continue.classList.add('hidden');
                if (this.elements.buttons.copy) this.elements.buttons.copy.classList.add('hidden');
            } else {
                // Done: Hide Spinner, Hide Stop, Show Continue/Copy
                this.elements.loadingSpinner.classList.add('hidden');
                
                if (text) {
                     this.elements.footerOverlay.classList.remove('hidden');
                     if (this.elements.buttons.stop) this.elements.buttons.stop.classList.add('hidden');
                     if (this.elements.buttons.continue) this.elements.buttons.continue.classList.remove('hidden');

                    if (this.elements.buttons.copy) {
                        this.elements.buttons.copy.innerHTML = ICONS.COPY;
                        this.elements.buttons.copy.classList.remove('hidden');
                    }
                } else {
                    // Empty and not streaming
                    this.elements.footerOverlay.classList.add('hidden');
                    if (this.elements.buttons.copy) this.elements.buttons.copy.classList.add('hidden');
                }
            }

            // Apply scroll if needed
            if (resultArea && shouldScrollBottom) {
                resultArea.scrollTop = resultArea.scrollHeight;
            }
        }

        showError(text) {
             if (!this.elements.askWindow) return;
             this.elements.loadingSpinner.classList.add('hidden');
             this.elements.footerOverlay.classList.add('hidden');
             if (this.elements.buttons.copy) this.elements.buttons.copy.classList.add('hidden');
             this.elements.resultText.innerHTML = `<p style="color:#d93025; font-weight:500;">Error: ${text}</p>`;
        }
        
        toggleCopyIcon(success) {
            if (!this.elements.buttons.copy) return;
            this.elements.buttons.copy.innerHTML = success ? ICONS.CHECK : ICONS.COPY;
        }

        setInputValue(text) {
            if (this.elements.askInput) this.elements.askInput.value = text;
        }

        isVisible() {
            return (this.elements.askWindow && this.elements.askWindow.classList.contains('visible'));
        }

        isHost(target) {
            return (this.elements.askWindow && this.elements.askWindow.contains(target));
        }
    }

    window.GeminiViewWindow = WindowView;
})();
