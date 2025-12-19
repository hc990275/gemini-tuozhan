// background/image.js

export class ImageHandler {
    
    // Fetch image from a URL or Data URI
    async fetchImage(url) {
        try {
            if (url.startsWith('data:')) {
                const matches = url.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    return {
                        action: "FETCH_IMAGE_RESULT",
                        base64: url,
                        type: matches[1],
                        name: "dropped_image.png"
                    };
                }
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error("Fetch failed: " + response.statusText);
            
            const blob = await response.blob();
            // Convert blob to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            return {
                action: "FETCH_IMAGE_RESULT",
                base64: base64,
                type: blob.type,
                name: "web_image.png"
            };

        } catch (e) {
            return {
                action: "FETCH_IMAGE_RESULT",
                error: e.message
            };
        }
    }

    // Capture the visible tab and return base64
    captureScreenshot() {
        return new Promise((resolve) => {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    resolve({
                        action: "FETCH_IMAGE_RESULT",
                        error: "Capture failed"
                    });
                    return;
                }
                
                resolve({
                    action: "FETCH_IMAGE_RESULT",
                    base64: dataUrl,
                    type: "image/png",
                    name: "screenshot.png"
                });
            });
        });
    }

    // Used when content script selects an area
    captureArea(area) {
        return new Promise((resolve) => {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    console.error("Capture failed:", chrome.runtime.lastError);
                    resolve(null);
                    return;
                }
                
                // Return data to UI for cropping
                resolve({
                    action: "CROP_SCREENSHOT",
                    image: dataUrl,
                    area: area
                });
            });
        });
    }
}