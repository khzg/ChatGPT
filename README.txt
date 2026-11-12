AI Chat Everywhere
===================

WHAT'S NEW
- AI websites open in a new tab by default. Enable “Open AI websites in Firefox Sidebar” to open provider sites in Firefox's actual sidebar panel.
- Sidebar open is triggered synchronously from the user click; this avoids losing Firefox's user-activation permission across an awaited storage call.
- Prompt library includes 41 free and 71 original Complete Pro templates (112 total), with category filters, search, and 12-item pagination.
- Complete Pro is now a single purchase and one signed activation code unlocks Prompt Studio, Multi-Chat, and Web Research.
- Prompt JSON import/export is validated, deduplicated, backward-compatible with previous prompt exports, and uses standard local file controls without the Downloads permission.
- Research projects can be imported/exported as validated JSON backups; Markdown export remains available.
- Web Research project creation controls now have more spacing; each project is capped at 20 sources and each capture is bounded to 9,000 characters to help keep storage and rendering predictable.

INSTALL TEMPORARILY
1. Extract this ZIP.
2. Open about:debugging#/runtime/this-firefox in Firefox.
3. Select “Load Temporary Add-on”.
4. Choose manifest.json from the extracted folder.

PUBLISHER SETUP
- Open config.js and replace YOUR_TELEGRAM_USERNAME with the publisher's Telegram username (without @).
- Optionally change completeProPriceLabel to the actual public price or currency.
- The add-on's Firefox Add-ons page and GitHub URL are in config.js.

COMPLETE PRO LICENSES
- Use the separate PRIVATE Complete Pro License Issuer package to create a single Complete Pro code.
- The issuer package contains the private signing key. Never publish it or send it to a customer.
- Select duration in days (0 means lifetime), enter an optional customer note, and generate a signed code.
- The public extension contains only the public verification key.
- New v2 codes unlock all three Pro workspaces. Previous v1 codes remain valid only for the features included when they were issued.
- Offline licenses are transferable and cannot be remotely revoked.

PRIVACY / API
- No AI provider API keys are required.
- The extension does not send page text or prompt content to any server. Content is copied/exported only after user action.
- Prompt and research exports use local Blob downloads and imports use the file picker. No Downloads permission is requested.
