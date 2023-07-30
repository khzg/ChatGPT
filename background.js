// Function to create context menu items
function createContextMenus() {
  browser.contextMenus.create({
    id: "openInSidebar",
    title: "Open chat in Sidebar",
    contexts: ["all"], 
  });

  browser.contextMenus.create({
    id: "openInNewTab",
    title: "Open chat in New Tab",
    contexts: ["all"], 
  });
}

createContextMenus();

browser.contextMenus.onClicked.addListener(function (info, tab) {
  const chatgptLink = "https://chat.openai.com/chat"; 

  if (info.menuItemId === "openInSidebar") {
    browser.sidebarAction.open();
    browser.sidebarAction.setPanel({ panel: chatgptLink });
  } else if (info.menuItemId === "openInNewTab") {
      browser.tabs.create({ url: chatgptLink });
  }
});
