
// messaging.js

export function sendToBackground(payload) {
    window.parent.postMessage({
        action: 'FORWARD_TO_BACKGROUND',
        payload: payload
    }, '*');
}

export function saveSessionsToStorage(sessions) {
    window.parent.postMessage({
        action: 'SAVE_SESSIONS',
        payload: sessions
    }, '*');
}

export function saveShortcutsToStorage(shortcuts) {
    window.parent.postMessage({
        action: 'SAVE_SHORTCUTS',
        payload: shortcuts
    }, '*');
}

export function requestThemeFromStorage() {
    window.parent.postMessage({ action: 'GET_THEME' }, '*');
}

export function saveThemeToStorage(theme) {
    window.parent.postMessage({
        action: 'SAVE_THEME',
        payload: theme
    }, '*');
}

export function requestLanguageFromStorage() {
    window.parent.postMessage({ action: 'GET_LANGUAGE' }, '*');
}

export function saveLanguageToStorage(lang) {
    window.parent.postMessage({
        action: 'SAVE_LANGUAGE',
        payload: lang
    }, '*');
}

export function requestTextSelectionFromStorage() {
    window.parent.postMessage({ action: 'GET_TEXT_SELECTION' }, '*');
}

export function saveTextSelectionToStorage(enabled) {
    window.parent.postMessage({
        action: 'SAVE_TEXT_SELECTION',
        payload: enabled
    }, '*');
}
