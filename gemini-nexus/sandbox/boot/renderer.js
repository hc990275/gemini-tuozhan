
// sandbox/boot/renderer.js
import { loadLibs } from './loader.js';
import { transformMarkdown } from '../render/pipeline.js';

export function initRendererMode() {
    document.body.innerHTML = ''; // Clear UI
    
    // Load libs immediately
    loadLibs();

    window.addEventListener('message', (e) => {
        if (e.data.action === 'RENDER') {
            const { text, reqId } = e.data;
            
            try {
                // Use shared pipeline
                let html = transformMarkdown(text);
                
                // For the content script bridge, we must render KaTeX to string directly
                // because the content script doesn't have KaTeX loaded in its DOM context.
                if (typeof katex !== 'undefined') {
                    // Block Math
                    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (m, c) => {
                        try { return katex.renderToString(c, { displayMode: true, throwOnError: false }); } catch(err){ return m; }
                    });
                    
                    // Inline Math
                    html = html.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$/g, (m, c) => {
                         try { return katex.renderToString(c, { displayMode: false, throwOnError: false }); } catch(err){ return m; }
                    });
                }

                e.source.postMessage({ action: 'RENDER_RESULT', html: html, reqId }, { targetOrigin: '*' });
            } catch (err) {
                console.error("Render error", err);
                // Fallback to raw text on error
                e.source.postMessage({ action: 'RENDER_RESULT', html: text, reqId }, { targetOrigin: '*' });
            }
        }
    });
}
