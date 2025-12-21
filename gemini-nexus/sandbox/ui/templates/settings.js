
export const SettingsTemplate = `
    <!-- SETTINGS -->
    <div id="settings-modal" class="settings-modal">
        <div class="settings-content">
            <div class="settings-header">
                <h3 data-i18n="settingsTitle">Settings</h3>
                <button id="close-settings" class="icon-btn small" data-i18n-title="close" title="Close">✕</button>
            </div>
            <div class="settings-body">
                <div class="setting-group">
                    <h4 data-i18n="general">General</h4>
                    <div class="shortcut-row" style="margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <label data-i18n="textSelection" style="font-weight: 500; display: block; margin-bottom: 2px;">Text Selection Toolbar</label>
                            <span class="setting-desc" data-i18n="textSelectionDesc">Show floating toolbar when selecting text.</span>
                        </div>
                        <input type="checkbox" id="text-selection-toggle" style="width: 20px; height: 20px; cursor: pointer;">
                    </div>
                </div>

                <div class="setting-group">
                    <h4 data-i18n="appearance">Appearance</h4>
                    <div class="shortcut-row">
                        <label data-i18n="theme">Theme</label>
                        <select id="theme-select" class="shortcut-input" style="width: auto; padding: 6px 12px; text-align: left;">
                            <option value="system" data-i18n="system">System Default</option>
                            <option value="light" data-i18n="light">Light</option>
                            <option value="dark" data-i18n="dark">Dark</option>
                        </select>
                    </div>
                    <div class="shortcut-row">
                        <label data-i18n="language">Language</label>
                        <select id="language-select" class="shortcut-input" style="width: auto; padding: 6px 12px; text-align: left;">
                            <option value="system" data-i18n="system">System Default</option>
                            <option value="en">English</option>
                            <option value="zh">中文</option>
                        </select>
                    </div>
                </div>

                <div class="setting-group">
                    <h4 data-i18n="keyboardShortcuts">Keyboard Shortcuts</h4>
                    <p class="setting-desc" style="margin-bottom: 12px;" data-i18n="shortcutDesc">Click input and press keys to change.</p>
                    
                    <div class="shortcut-row">
                        <label data-i18n="quickAsk">Quick Ask (Floating)</label>
                        <input type="text" id="shortcut-quick-ask" class="shortcut-input" readonly value="Ctrl+Q">
                    </div>
                    
                    <div class="shortcut-row">
                        <label data-i18n="openSidePanel">Open Side Panel</label>
                        <input type="text" id="shortcut-open-panel" class="shortcut-input" readonly value="Ctrl+P">
                    </div>

                    <div class="shortcut-row" style="opacity: 0.6;">
                        <label data-i18n="openExtension">Open Extension</label>
                        <div class="shortcut-static">Ctrl+Shift+P (Browser Managed)</div>
                    </div>

                    <div class="settings-actions">
                        <button id="reset-shortcuts" class="btn-secondary" data-i18n="resetDefault">Reset Default</button>
                        <button id="save-shortcuts" class="btn-primary" data-i18n="saveChanges">Save Changes</button>
                    </div>
                </div>

                <div class="setting-group">
                    <h4 data-i18n="about">About</h4>
                    <p class="setting-info"><strong>Gemini Nexus</strong> v3.1.0</p>
                    
                    <div style="display: flex; gap: 16px; margin-top: 8px;">
                        <a href="https://github.com/yeahhe365/gemini-nexus" target="_blank" class="github-link" style="margin-top: 0;">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            <span data-i18n="sourceCode">Source Code</span>
                            <span id="star-count" class="star-badge"></span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
