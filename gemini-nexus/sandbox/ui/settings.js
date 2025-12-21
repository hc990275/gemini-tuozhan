
// sandbox/ui/settings.js
import { saveShortcutsToStorage, saveThemeToStorage, requestThemeFromStorage, saveLanguageToStorage, requestLanguageFromStorage, saveTextSelectionToStorage, requestTextSelectionFromStorage } from '../../lib/messaging.js';
import { setLanguagePreference, getLanguagePreference } from '../core/i18n.js';

export class SettingsController {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        
        this.shortcuts = {
            quickAsk: "Ctrl+Q",
            openPanel: "Ctrl+P"
        };
        this.defaultShortcuts = { ...this.shortcuts };
        this.textSelectionEnabled = true;

        this.queryElements();
        this.initListeners();
    }

    queryElements() {
        this.modal = document.getElementById('settings-modal');
        this.btnOpen = document.getElementById('settings-btn'); // External trigger
        this.btnClose = document.getElementById('close-settings');
        this.themeSelect = document.getElementById('theme-select');
        this.languageSelect = document.getElementById('language-select');
        this.inputQuickAsk = document.getElementById('shortcut-quick-ask');
        this.inputOpenPanel = document.getElementById('shortcut-open-panel');
        this.btnSave = document.getElementById('save-shortcuts');
        this.btnReset = document.getElementById('reset-shortcuts');
        this.textSelectionToggle = document.getElementById('text-selection-toggle');
    }

    initListeners() {
        // Modal Visibility
        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', () => {
                this.open();
                if (this.callbacks.onOpen) this.callbacks.onOpen();
            });
        }
        
        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => this.close());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        // Theme
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
        
        // System Theme Listener (Real-time update)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
             if (this.themeSelect && this.themeSelect.value === 'system') {
                 this._applyVisualTheme('system');
             }
        });

        // Language
        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (e) => {
                const newLang = e.target.value;
                setLanguagePreference(newLang);
                saveLanguageToStorage(newLang);
                // Dispatch event to update UI immediately
                document.dispatchEvent(new CustomEvent('gemini-language-changed'));
            });
        }
        
        // Text Selection Toggle
        if (this.textSelectionToggle) {
            this.textSelectionToggle.addEventListener('change', (e) => {
                this.textSelectionEnabled = e.target.checked;
                saveTextSelectionToStorage(this.textSelectionEnabled);
            });
        }

        // Shortcuts
        this.setupShortcutInput(this.inputQuickAsk);
        this.setupShortcutInput(this.inputOpenPanel);

        if (this.btnSave) {
            this.btnSave.addEventListener('click', () => {
                this.shortcuts.quickAsk = this.inputQuickAsk.value;
                this.shortcuts.openPanel = this.inputOpenPanel.value;
                saveShortcutsToStorage(this.shortcuts);
                this.close();
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => {
                this.inputQuickAsk.value = this.defaultShortcuts.quickAsk;
                this.inputOpenPanel.value = this.defaultShortcuts.openPanel;
            });
        }

        // Escape Key for Settings
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('visible')) {
                this.close();
            }
        });
    }

    open() {
        if (this.modal) {
            this.modal.classList.add('visible');
            this.fetchGithubStars();
            // Sync inputs
            if(this.inputQuickAsk) this.inputQuickAsk.value = this.shortcuts.quickAsk;
            if(this.inputOpenPanel) this.inputOpenPanel.value = this.shortcuts.openPanel;
            if(this.languageSelect) this.languageSelect.value = getLanguagePreference();
            
            // Fetch current settings
            requestTextSelectionFromStorage();
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('visible');
        }
    }

    setTheme(theme) {
        this._applyVisualTheme(theme);
        saveThemeToStorage(theme);
    }
    
    updateTheme(theme) {
        this._applyVisualTheme(theme);
        if(this.themeSelect) this.themeSelect.value = theme;
    }
    
    _applyVisualTheme(theme) {
        let applied = theme;
        if (theme === 'system') {
             applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', applied);
    }
    
    updateLanguage(lang) {
        setLanguagePreference(lang);
        if(this.languageSelect) this.languageSelect.value = lang;
        // Trigger UI update from controller
        document.dispatchEvent(new CustomEvent('gemini-language-changed'));
    }

    updateShortcuts(payload) {
        if (payload) {
            this.shortcuts = { ...this.defaultShortcuts, ...payload };
            if(this.inputQuickAsk) this.inputQuickAsk.value = this.shortcuts.quickAsk;
            if(this.inputOpenPanel) this.inputOpenPanel.value = this.shortcuts.openPanel;
        }
    }
    
    updateTextSelection(enabled) {
        this.textSelectionEnabled = enabled;
        if (this.textSelectionToggle) {
            this.textSelectionToggle.checked = enabled;
        }
    }

    setupShortcutInput(inputEl) {
        if (!inputEl) return;
        inputEl.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
            
            const keys = [];
            if (e.ctrlKey) keys.push('Ctrl');
            if (e.altKey) keys.push('Alt');
            if (e.shiftKey) keys.push('Shift');
            if (e.metaKey) keys.push('Meta');
            
            let k = e.key.toUpperCase();
            if (k === ' ') k = 'Space';
            keys.push(k);

            inputEl.value = keys.join('+');
        });
    }

    async fetchGithubStars() {
        const starEl = document.getElementById('star-count');
        if (!starEl || starEl.dataset.fetched) return; 

        try {
            const res = await fetch('https://api.github.com/repos/yeahhe365/gemini-nexus');
            if (res.ok) {
                const data = await res.json();
                const count = data.stargazers_count;
                const formatted = count > 999 ? (count/1000).toFixed(1) + 'k' : count;
                starEl.textContent = `★ ${formatted}`;
                starEl.style.display = 'inline-flex';
                starEl.dataset.fetched = "true";
            }
        } catch (e) {
            console.log("Failed to fetch GitHub stars", e);
            starEl.style.display = 'none';
        }
    }
}
