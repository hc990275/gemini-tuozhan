
// sandbox/core/image_manager.js

export class ImageManager {
    constructor(elements, callbacks = {}) {
        this.imageInput = elements.imageInput;
        this.imagePreview = elements.imagePreview;
        // previewThumb and removeImgBtn are removed/deprecated in multi-file UI
        this.inputWrapper = elements.inputWrapper;
        this.inputFn = elements.inputFn;
        
        this.onUrlDrop = callbacks.onUrlDrop;
        
        this.files = []; // Array of { base64, type, name }

        this.initListeners();
    }

    initListeners() {
        // File selection
        this.imageInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                Array.from(files).forEach(file => this.handleFile(file));
                // Reset input so same file can be selected again
                this.imageInput.value = '';
            }
        });

        // Paste Support
        document.addEventListener('paste', (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.kind === 'file') {
                    e.preventDefault();
                    const file = item.getAsFile();
                    this.handleFile(file);
                }
            }
        });

        // Drag and Drop
        const dropZone = document.body;
        let dragCounter = 0;

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault(); e.stopPropagation();
            dragCounter++;
            this.inputWrapper.classList.add('dragging');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault(); e.stopPropagation();
            dragCounter--;
            if (dragCounter === 0) {
                this.inputWrapper.classList.remove('dragging');
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); e.stopPropagation(); 
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation();
            dragCounter = 0;
            this.inputWrapper.classList.remove('dragging');

            // 1. Files (System Drag)
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                Array.from(files).forEach(file => this.handleFile(file));
                return;
            }

            // 2. Web Content (URL/Image Drag)
            if (this.onUrlDrop) {
                const url = this._extractUrl(e.dataTransfer);
                if (url) this.onUrlDrop(url);
            }
        });
    }

    _extractUrl(dt) {
        // 1. Try HTML first (Extract <img> src)
        // This is the most reliable way for images dragged from web pages,
        // as it avoids getting the link URL if the image is wrapped in an anchor tag.
        const html = dt.getData('text/html');
        if (html) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const img = doc.querySelector('img');
                // Ensure we got an image and the src is absolute (http) or data URI
                // to avoid issues with relative paths in sandbox context.
                if (img && img.src && (img.src.startsWith('http') || img.src.startsWith('data:'))) {
                    return img.src;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        // 2. Try URI List (Standard for links)
        const uriList = dt.getData('text/uri-list');
        if (uriList) {
            const lines = uriList.split(/[\r\n]+/);
            for (const line of lines) {
                const clean = line.trim();
                if (clean && !clean.startsWith('#')) return clean;
            }
        }

        // 3. Fallback to Plain Text (if URL-like)
        const text = dt.getData('text/plain');
        if (text) {
            const clean = text.trim();
            if (clean.match(/^https?:\/\//) || clean.startsWith('data:image')) {
                return clean;
            }
        }
        
        return null;
    }

    handleFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this.addFile(event.target.result, file.type, file.name);
        };
        reader.readAsDataURL(file);
    }

    // Used by background response handler or direct file input
    setFile(base64, type, name) {
        this.addFile(base64, type, name);
    }

    addFile(base64, type, name) {
        this.files.push({ base64, type, name });
        this._render();
        this.inputFn.focus();
    }
    
    removeFile(index) {
        this.files.splice(index, 1);
        this._render();
    }

    clearFile() {
        this.files = [];
        this._render();
    }

    getFiles() {
        return [...this.files];
    }
    
    // Kept for backward compatibility if needed, but returns the first file or null
    getFileData() {
        if (this.files.length > 0) {
            return this.files[0];
        }
        return { base64: null, type: null, name: null };
    }

    _render() {
        this.imagePreview.innerHTML = '';
        
        if (this.files.length === 0) {
            this.imagePreview.classList.remove('has-image');
            return;
        }
        
        this.imagePreview.classList.add('has-image');
        
        this.files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            
            // Remove Button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'preview-remove-btn';
            removeBtn.innerHTML = '✕';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                this.removeFile(index);
            };
            item.appendChild(removeBtn);
            
            // Content
            if (file.type && file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = file.base64;
                item.appendChild(img);
            } else {
                const card = document.createElement('div');
                card.className = 'file-item-card';
                card.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span>${file.name}</span>
                `;
                item.appendChild(card);
            }
            
            this.imagePreview.appendChild(item);
        });
    }
}
