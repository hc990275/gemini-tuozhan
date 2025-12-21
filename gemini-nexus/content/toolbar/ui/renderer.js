
// content/toolbar/ui/renderer.js
(function() {
    /**
     * Handles the rendering of results in the toolbar window,
     * including Markdown transformation (via Bridge) and Generated Images grid.
     */
    class UIRenderer {
        constructor(view, bridge) {
            this.view = view;
            this.bridge = bridge;
            this.currentResultText = '';
        }

        /**
         * Renders the text result and optionally processes generated images.
         */
        async show(text, title, isStreaming, images = []) {
            this.currentResultText = text;
            
            // Delegate rendering to iframe (Offscreen Renderer)
            let html = text;
            if (this.bridge) {
                try {
                    html = await this.bridge.render(text);
                } catch (e) {
                    console.warn("Bridge render failed, falling back to simple escape");
                    html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
                }
            }

            // Append Images HTML if present and finished
            if (!isStreaming && images && images.length > 0) {
                 const { imageHtml, fetchTasks } = this._generateImagesHtml(images);
                 html += imageHtml;
                 
                 // Pass to view
                 this.view.showResult(html, title, isStreaming);
                 
                 // Execute fetch tasks after DOM update
                 this._executeImageFetchTasks(fetchTasks);
            } else {
                 // Pass to view
                 this.view.showResult(html, title, isStreaming);
            }
        }

        _generateImagesHtml(images) {
             let html = '<div class="generated-images-grid">';
             const fetchTasks = [];
             
             // Only display the first generated image
             const displayImages = images.length > 0 ? [images[0]] : [];
             
             displayImages.forEach(imgData => {
                 const reqId = "gen_img_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
                 let targetUrl = imgData.url;
                 
                 if (targetUrl) {
                    // HD Upgrade logic similar to generated_image.js
                    const parts = targetUrl.split('?');
                    let base = parts[0];
                    const query = parts.slice(1).join('?');
                    const lastSlash = base.lastIndexOf('/');
                    const lastEquals = base.lastIndexOf('=');
                    if (lastEquals > lastSlash) {
                        base = base.substring(0, lastEquals);
                    }
                    base += "=s0";
                    targetUrl = base + (query ? '?' + query : '');
                 }

                 html += `<img class="generated-image loading" alt="${imgData.alt || 'Generated Image'}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==" data-req-id="${reqId}">`;
                 
                 fetchTasks.push({ reqId, url: targetUrl });
             });
             
             html += '</div>';
             return { imageHtml: html, fetchTasks };
        }
        
        _executeImageFetchTasks(tasks) {
            const container = this.view.elements.resultText;
            if(!container) return;

            tasks.forEach(task => {
                const img = container.querySelector(`img[data-req-id="${task.reqId}"]`);
                if(img) {
                    // Send message to background to fetch actual image
                    chrome.runtime.sendMessage({ 
                        action: "FETCH_GENERATED_IMAGE", 
                        url: task.url, 
                        reqId: task.reqId 
                    });
                }
            });
        }
        
        handleGeneratedImageResult(request) {
             const container = this.view.elements.resultText;
             if(!container) return;
             
             const img = container.querySelector(`img[data-req-id="${request.reqId}"]`);
             if (img) {
                 if (request.base64) {
                     img.src = request.base64;
                     img.classList.remove('loading');
                     img.style.minHeight = "auto";
                 } else {
                     img.style.background = "#ffebee";
                     img.alt = "Failed to load";
                 }
             }
        }

        get currentText() {
            return this.currentResultText;
        }
    }

    window.GeminiUIRenderer = UIRenderer;
})();
