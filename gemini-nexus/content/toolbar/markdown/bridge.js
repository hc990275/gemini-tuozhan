// content/toolbar/markdown/bridge.js
(function() {
    class RendererBridge {
        constructor(hostElement) {
            this.host = hostElement;
            this.iframe = null;
            this.renderRequests = {};
            this.reqId = 0;
            this.init();
        }

        init() {
            this.iframe = document.createElement('iframe');
            this.iframe.src = chrome.runtime.getURL('sandbox.html?mode=renderer');
            this.iframe.style.display = 'none';
            // Append to main host (outside shadow) to ensure it loads
            this.host.appendChild(this.iframe);
            
            window.addEventListener('message', (e) => {
                if (e.data.action === 'RENDER_RESULT') {
                    const { html, reqId } = e.data;
                    if (this.renderRequests[reqId]) {
                        this.renderRequests[reqId](html);
                        delete this.renderRequests[reqId];
                    }
                }
            });
        }
        
        async render(text) {
            const id = this.reqId++;
            return new Promise((resolve) => {
                this.renderRequests[id] = resolve;
                // Wait for iframe to be ready? Assuming it loads fast enough.
                if (this.iframe.contentWindow) {
                     this.iframe.contentWindow.postMessage({ action: 'RENDER', text, reqId: id }, '*');
                } else {
                     resolve(text); // Fallback
                }
            });
        }
    }

    window.GeminiRendererBridge = RendererBridge;
})();