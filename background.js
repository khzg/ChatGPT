// Function to create context menu items
function createContextMenus() {
  browser.contextMenus.create({
    id: "openInSidebar",
    title: "Open chat in Sidebar",
    contexts: ["page"], 
  });

  browser.contextMenus.create({
    id: "openInNewTab",
    title: "Open chat in New Tab",
    contexts: ["all"], 
  });
}

createContextMenus();

browser.contextMenus.onClicked.addListener(function (info, tab) {
  const checkboxState = JSON.parse(localStorage.getItem("openInNewTab")) || false;
  const chatgptLink = "https://chat.openai.com/chat"; 

  if (info.menuItemId === "openInSidebar") {
    browser.sidebarAction.open();
    browser.sidebarAction.setPanel({ panel: chatgptLink });
  } else if (info.menuItemId === "openInNewTab") {
    if (checkboxState) {
      browser.tabs.create({ url: chatgptLink });
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({ panel: chatgptLink });
    }
  }
});
