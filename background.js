// Create a context menu item
browser.contextMenus.create({
    id: "chatGptMenu",
    title: "ChatGPT everywhere",
    contexts: ["all"],
  });
  
  
  browser.contextMenus.onClicked.addListener(function(info) {
    if (info.menuItemId === "chatGptMenu") {
      browser.sidebarAction.open();
      browser.storage.local.get("chatgptLink").then(function(result) {
        var chatgptLink = result.chatgptLink;
        browser.sidebarAction.setPanel({ panel: chatgptLink });
      });
    }
  });
  

  
  