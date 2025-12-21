
// sandbox/render/generated_image.js
import { sendToBackground } from '../../lib/messaging.js';

export function createGeneratedImage(imgData) {
    const img = document.createElement('img');
    img.className = 'generated-image loading';
    img.alt = imgData.alt || "Generated Image";
    
    // Loading Placeholder (Transparent 1x1 SVG)
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==';
    
    // Generate Unique Request ID for background fetching correlation
    const reqId = "gen_img_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    img.dataset.reqId = reqId;

    // Visual Placeholder Style
    img.style.background = "#f0f4f9";
    img.style.minHeight = "200px"; // Prevent layout shift before CSS loads or image renders
    img.style.display = "block";

    // Upgrade to HD (Original Size) - Use =s0 for original quality/size
    let targetUrl = imgData.url;
    if (targetUrl) {
        // Robustly replace or append size parameter
        // 1. Separate base and query to avoid modifying query strings
        const parts = targetUrl.split('?');
        let base = parts[0];
        const query = parts.slice(1).join('?');

        // 2. Check for existing parameters in the path (after the last slash)
        // Google Image URLs typically end with params like =s1024, =w500-h500, etc.
        const lastSlash = base.lastIndexOf('/');
        const lastEquals = base.lastIndexOf('=');

        if (lastEquals > lastSlash) {
            // Strip existing parameter completely
            base = base.substring(0, lastEquals);
        }

        // 3. Append high-res parameter (Use =s0 for original size/quality for optimal watermark removal)
        base += "=s0";

        // 4. Reassemble
        targetUrl = base + (query ? '?' + query : '');
    }

    // Request Background Fetch (Proxy) to handle CORS/Cookies and get Base64
    sendToBackground({ 
        action: "FETCH_GENERATED_IMAGE", 
        url: targetUrl, 
        reqId: reqId 
    });

    // Click to view full size (works once the src is populated with base64)
    img.addEventListener('click', () => {
        if (img.src && !img.src.startsWith('data:image/svg')) {
            document.dispatchEvent(new CustomEvent('gemini-view-image', { detail: img.src }));
        }
    });
    
    return img;
}