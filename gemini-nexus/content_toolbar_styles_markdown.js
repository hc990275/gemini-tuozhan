
// content_toolbar_styles_markdown.js
(function() {
    window.GeminiStylesMarkdown = `
        /* Result Area */
        .result-area {
            flex: 1;
            overflow-y: auto;
            position: relative;
            font-size: 14px;
            line-height: 1.6;
            color: #1f1f1f;
            padding-right: 4px; /* Space for scrollbar */
            padding-bottom: 40px; /* Space for copy/continue button */
        }
        
        .result-area::-webkit-scrollbar { width: 6px; }
        .result-area::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }
        .result-area::-webkit-scrollbar-thumb:hover { background: #d0d0d0; }

        /* --- Markdown Styles --- */

        .markdown-body p { margin: 0 0 12px 0; }
        .markdown-body p:last-child { margin-bottom: 0; }
        
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin: 16px 0 8px 0; color: #1f1f1f; font-weight: 600; }
        .markdown-body h1 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .markdown-body h2 { font-size: 18px; }
        .markdown-body h3 { font-size: 16px; }

        .markdown-body ul, .markdown-body ol { margin: 0 0 12px 0; padding-left: 20px; }
        .markdown-body li { margin-bottom: 4px; }

        /* Code Blocks */
        .markdown-body pre {
            background: #f4f6f8;
            padding: 24px 12px 12px 12px; /* Top padding for lang label */
            border-radius: 8px;
            overflow-x: auto;
            margin: 12px 0;
            border: 1px solid #e1e3e1;
            position: relative; 
        }
        .code-lang {
            position: absolute;
            top: 0;
            right: 0;
            padding: 2px 8px;
            font-size: 10px;
            color: #666;
            background: #e1e3e1;
            border-bottom-left-radius: 6px;
            border-top-right-radius: 6px;
            text-transform: uppercase;
            font-family: sans-serif;
            font-weight: 600;
        }
        .markdown-body code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
            background: rgba(0,0,0,0.05);
            padding: 2px 4px;
            border-radius: 4px;
            color: #1f1f1f;
        }
        .markdown-body pre code {
            background: transparent;
            padding: 0;
            border: none;
            color: #1f1f1f;
            display: block;
        }

        /* Syntax Highlighting */
        .token-comment { color: #6a737d; font-style: italic; }
        .token-tag { color: #22863a; }
        .token-attr { color: #6f42c1; }
        .token-string { color: #032f62; }
        .token-keyword { color: #d73a49; }
        .token-number { color: #005cc5; }
        .token-doctag { color: #d73a49; font-weight: bold; }

        /* Tables */
        .markdown-body table {
            border-collapse: collapse;
            width: 100%;
            margin: 12px 0;
            font-size: 13px;
        }
        .markdown-body th, .markdown-body td {
            border: 1px solid #e1e3e1;
            padding: 8px 12px;
            text-align: left;
        }
        .markdown-body th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .markdown-body tr:nth-child(even) {
            background-color: #fcfcfc;
        }

        /* Links */
        .markdown-body a {
            color: #0b57d0;
            text-decoration: none;
        }
        .markdown-body a:hover {
            text-decoration: underline;
        }

        /* Images */
        .markdown-body img {
            max-width: 100%;
            border-radius: 8px;
            margin: 8px 0;
            border: 1px solid #e0e0e0;
        }

        /* Quotes & Misc */
        .markdown-body blockquote {
            border-left: 4px solid #0b57d0;
            margin: 12px 0;
            padding: 4px 16px;
            color: #444746;
            background: rgba(11, 87, 208, 0.04);
            border-radius: 0 4px 4px 0;
        }
        .markdown-body hr {
            border: none;
            border-top: 1px solid #e1e3e1;
            margin: 16px 0;
        }

        /* --- Footer & Misc --- */

        .spinner-container {
            display: flex;
            justify-content: center;
            padding: 20px;
        }
        .spinner-container.hidden { display: none; }
        
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e1e3e1;
            border-top-color: #0b57d0;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Floating Footer */
        .footer-overlay {
            position: absolute;
            bottom: 20px;
            left: 0; 
            right: 0;
            display: flex;
            justify-content: center;
            pointer-events: none; /* Let clicks pass through container */
            z-index: 100; /* Ensure high z-index to stay above content */
        }
        .footer-overlay.hidden { display: none; }
        
        .footer-overlay button {
            pointer-events: auto; /* Re-enable for buttons */
        }

        .stop-btn {
            background: #ffffff;
            color: #1f1f1f;
            border: 1px solid #e1e3e1;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        .stop-btn:hover {
            background: #f8f9fa;
            box-shadow: 0 4px 8px rgba(0,0,0,0.12);
        }

        .continue-btn {
            background: #0b57d0;
            color: #ffffff;
            border: none;
            box-shadow: 0 2px 6px rgba(11, 87, 208, 0.3);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        .continue-btn:hover {
            background: #0842a0;
            box-shadow: 0 4px 10px rgba(11, 87, 208, 0.4);
        }
        
        .stop-btn.hidden, .continue-btn.hidden { display: none; }

        /* Copy Button */
        .copy-float-btn {
            position: absolute;
            bottom: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            background: #ffffff;
            border: 1px solid #c4c7c5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: all 0.2s;
            color: #444746;
            z-index: 10;
        }
        .copy-float-btn:hover {
            background: #f0f4f9;
            color: #0b57d0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .copy-float-btn.hidden {
            display: none;
            opacity: 0;
            pointer-events: none;
        }
    `;
})();
