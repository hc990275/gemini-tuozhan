
// sandbox/render/config.js

export function configureMarkdown() {
    if (typeof marked === 'undefined') return;

    const renderer = new marked.Renderer();
    
    renderer.code = function(code, language) {
        const validLang = (language && hljs.getLanguage(language)) ? language : 'plaintext';
        let highlighted = code;
        
        if (typeof hljs !== 'undefined') {
            try {
                highlighted = hljs.highlight(code, { language: validLang }).value;
            } catch (e) {
                // Fallback
            }
        }

        return `
<div class="code-block-wrapper">
    <div class="code-header">
        <span class="code-lang">${validLang}</span>
        <button class="copy-code-btn" aria-label="Copy code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
        </button>
    </div>
    <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
</div>`;
    };

    marked.setOptions({ 
        breaks: true, 
        gfm: true,
        renderer: renderer
    });
}
