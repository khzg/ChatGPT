/* Firefox background script. Selection actions are prepared locally and shown in the extension Sidebar. */
const selectionActions = [
  {id: "ai-selection-summarize", title: "Prepare summary", task: "summarize"},
  {id: "ai-selection-translate", title: "Translate selection", task: "quick-action", action: "translate"},
  {id: "ai-selection-explain", title: "Explain selection", task: "quick-action", action: "explain"},
  {id: "ai-selection-rewrite", title: "Rewrite selection", task: "quick-action", action: "rewrite"},
  {id: "ai-selection-grammar", title: "Fix grammar", task: "quick-action", action: "grammar"},
  {id: "ai-selection-simplify", title: "Simplify selection", task: "quick-action", action: "simplify"},
  {id: "ai-selection-key-points", title: "Extract key points", task: "quick-action", action: "keypoints"},
  {id: "ai-selection-questions", title: "Generate questions", task: "quick-action", action: "questions"},
  {id: "ai-selection-ask", title: "Ask AI about selection", task: "quick-action", action: "ask"},
  {id: "ai-research-selection", title: "Add selection to research workspace", task: "research"}
];

function createContextMenus() {
  browser.menus.removeAll().then(() => {
    browser.menus.create({
      id: "ai-everywhere-root",
      title: "AI Chat Everywhere",
      contexts: ["selection"]
    });
    for (const action of selectionActions) {
      browser.menus.create({
        id: action.id,
        parentId: "ai-everywhere-root",
        title: action.title,
        contexts: ["selection"]
      });
    }
  }).catch(error => console.error("Could not refresh context menus:", error));
}

browser.runtime.onInstalled.addListener(createContextMenus);
browser.runtime.onStartup.addListener(createContextMenus);

browser.menus.onClicked.addListener((info, tab) => {
  const action = selectionActions.find(item => item.id === info.menuItemId);
  const selectedText = String(info.selectionText || "").trim();
  if (!action || !selectedText) return;

  const pending = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    task: action.task,
    action: action.action || "",
    text: selectedText.slice(0, 12000),
    title: action.title,
    url: tab?.url || "",
    createdAt: Date.now()
  };

  // Start persisting and opening the Sidebar immediately from the context-menu gesture.
  // No fallback tab is created: selection results stay inside the extension window.
  const setPanel = browser.sidebarAction.setPanel({panel: browser.runtime.getURL("sidebar.html")});
  const openPanel = browser.sidebarAction.open();
  const persist = browser.storage.local.set({pendingExtensionAction: pending});

  Promise.all([persist, setPanel, openPanel]).then(() => {
    browser.runtime.sendMessage({type: "AI_EVERYWHERE_PENDING_ACTION", id: pending.id}).catch(() => {});
  }).catch(error => {
    console.warn("Could not open the extension Sidebar for the selected text:", error);
  });
});

browser.commands.onCommand.addListener(command => {
  if (command !== "open-ai-hub") return;
  const setPanel = browser.sidebarAction.setPanel({panel: browser.runtime.getURL("sidebar.html")});
  const openPanel = browser.sidebarAction.open();
  Promise.all([setPanel, openPanel]).catch(error => {
    console.warn("Could not open the AI Everywhere Sidebar:", error);
  });
});
