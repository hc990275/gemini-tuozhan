
// content_overlay.js -> content/overlay.js

class SelectionOverlay {
    constructor() {
        this.overlay = null;
        this.selectionBox = null;
        this.hint = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;

        // Bind methods
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    start() {
        // Cleanup existing
        this.cleanup();
        this.createDOM();
        this.attachListeners();
    }

    createDOM() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'gemini-nexus-overlay';
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.4); z-index: 2147483647;
            cursor: crosshair; user-select: none;
        `;

        this.selectionBox = document.createElement('div');
        this.selectionBox.style.cssText = `
            position: fixed; border: 2px solid #0b57d0;
            background-color: rgba(11, 87, 208, 0.2);
            display: none; pointer-events: none; z-index: 2147483647;
        `;

        this.hint = document.createElement('div');
        this.hint.textContent = "Drag to capture area / Esc to cancel";
        this.hint.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            color: white; background: rgba(0, 0, 0, 0.8);
            padding: 8px 16px; border-radius: 20px; font-size: 14px;
            font-family: sans-serif; pointer-events: none; z-index: 2147483647;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        `;

        this.overlay.appendChild(this.selectionBox);
        this.overlay.appendChild(this.hint);
        (document.documentElement || document.body).appendChild(this.overlay);
    }

    attachListeners() {
        this.overlay.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove, { capture: true });
        window.addEventListener('mouseup', this.onMouseUp, { capture: true });
        window.addEventListener('keydown', this.onKeyDown, { capture: true });
    }

    cleanup() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        window.removeEventListener('mousemove', this.onMouseMove, true);
        window.removeEventListener('mouseup', this.onMouseUp, true);
        window.removeEventListener('keydown', this.onKeyDown, true);
        this.overlay = null;
        this.selectionBox = null;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        this.selectionBox.style.display = 'block';
        this.selectionBox.style.left = this.startX + 'px';
        this.selectionBox.style.top = this.startY + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        
        this.hint.style.display = 'none';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);

        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
    }

    onMouseUp(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = false;

        const rect = this.selectionBox.getBoundingClientRect();
        this.cleanup();

        if (rect.width < 5 || rect.height < 5) {
            console.log("Selection too small, cancelled.");
            return;
        }

        setTimeout(() => {
            chrome.runtime.sendMessage({
                action: "AREA_SELECTED",
                area: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    pixelRatio: window.devicePixelRatio
                }
            });
        }, 50);
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.cleanup();
        }
    }
}

// Attach to window so content.js can access it
window.GeminiNexusOverlay = SelectionOverlay;
