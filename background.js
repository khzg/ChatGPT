/* Firefox background script. All page processing remains local; no AI API calls. */
const selectionActions = [
  {id: "ai-summary-selection", title: "Prepare summary of selection", task: "summarize"},
  {id: "ai-research-selection", title: "Add selection to research workspace", task: "research"}
];

function createContextMenus() {
  browser.menus.removeAll().then(() => {
    browser.menus.create({id: "ai-everywhere-root", title: "AI Chat Everywhere", contexts: ["selection"]});
    for (const action of selectionActions) {
      browser.menus.create({id: action.id, parentId: "ai-everywhere-root", title: action.title, contexts: ["selection"]});
    }
  }).catch(error => console.error("Could not refresh context menus:", error));
}

browser.runtime.onInstalled.addListener(createContextMenus);
browser.runtime.onStartup.addListener(createContextMenus);

browser.menus.onClicked.addListener(async (info, tab) => {
  const action = selectionActions.find(item => item.id === info.menuItemId);
  const text = String(info.selectionText || "").trim();
  if (!action || !text) return;
  const pending = {task: action.task, text: text.slice(0, 9000), title: action.task === "summarize" ? "Selected text" : "Browser selection", url: tab?.url || "", createdAt: Date.now()};
  try {
    await browser.storage.local.set({pendingExtensionAction: pending});
    const target = new URL(browser.runtime.getURL("sidebar.html"));
    await browser.tabs.create({url: target.toString(), active: true});
  } catch (error) {
    console.warn("Could not open the extension workspace for the selected text:", error);
  }
});

browser.commands.onCommand.addListener(command => {
  if (command !== "open-ai-hub") return;
  // Keep sidebarAction.open() in the command handler's synchronous user-gesture path.
  const setPanel = browser.sidebarAction.setPanel({panel: browser.runtime.getURL("sidebar.html")});
  const openPanel = browser.sidebarAction.open();
  Promise.all([setPanel, openPanel]).catch(error => {
    console.warn("Could not open sidebar:", error);
    browser.tabs.create({url: browser.runtime.getURL("sidebar.html"), active: true});
  });
});
