AI Chat Everywhere
===================

WHAT'S NEW IN THIS BUILD
- Refined the free local Conversation Manager with current-chat saving, folders, tags, full-text search, pinning, archiving, rename, delete and library export. Removed ChatGPT/backup JSON import from the Chats screen.
- Simplified YouTube AI: removed the separate video-link copy control and clarified the workflow. The active video's URL is included in the prepared Gemini prompt; the red inline hint appears when no YouTube video is active.
- Expanded the free right-click menu with translate, explain, rewrite, grammar correction, simplify, key points, question generation and ask-AI actions. Prepared prompts appear inside the extension Sidebar; no new browser tab is opened for these selection actions.
- Removed the home-page quick-action cards to bring the AI directory closer to the search field.
- Removed the editable Telegram-support block from the Pro page. Telegram contact and current pricing are read from config.js.
- Complete Pro pricing is configured as $4 / 3 months.
- Prompt library includes 41 free and 71 original Complete Pro templates (112 total), with category filters, search, and 12-item pagination.
- Prompt JSON import/export is validated, deduplicated, backward-compatible with previous prompt exports, and uses standard local file controls without the Downloads permission.
- Research projects can be imported/exported as validated JSON backups; Markdown export remains available.

INSTALL TEMPORARILY
1. Extract this ZIP.
2. Open about:debugging#/runtime/this-firefox in Firefox.
3. Select “Load Temporary Add-on”.
4. Choose manifest.json from the extracted folder.

PUBLISHER SETUP
- Verify telegramUsername in config.js (without @).
- Verify completeProPriceLabel in config.js; the current setting is "$4 / 3 months".
- The add-on's Firefox Add-ons page and GitHub URL are in config.js.

COMPLETE PRO LICENSES
- Use the separate PRIVATE Complete Pro License Issuer package to create a time-limited Complete Pro code.
- The issuer package contains the private signing key. Never publish it or send it to a customer.
- Set the code's validity period to match the access sold, enter an optional customer note, and generate a signed code.
- The public extension contains only the public verification key.
- New v2 codes unlock all three Pro workspaces. Previous v1 codes remain valid only for the features included when they were issued.
- Offline licenses are transferable and cannot be remotely revoked.

PRIVACY / API
- No AI provider API keys or separate AI Chat Everywhere account are required. You may need an account with the AI provider you choose.
- The extension does not send page text, conversation archives or prompt content to an extension-operated server.
- Conversation Manager data, prompt data and research data are stored locally in Firefox extension storage.
- Prompt, research and conversation-library exports use local Blob downloads and imports use the file picker. No Downloads permission is requested.

V23 UI refinements
- Added a full-width seven-color accent strip to the top of Popup and Sidebar.
- Replaced the inline Add website form with a centered modal dialog that stays in the extension viewport.
- The Add website dialog autofocuses the name field and closes with its close button, backdrop click, or Escape.

V22 UI refinements
- Added a native, accessible in-extension dialog for conversation rename and delete confirmation, keeping all controls inside the panel.
- Refreshed colors, surfaces, spacing, action states, focus styles, reduced-motion behavior and responsive touch targets across Popup and Sidebar.
- The initial color theme now follows the operating-system preference unless the user has already selected a theme.
