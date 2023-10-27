document.addEventListener("DOMContentLoaded", function () {
  // Open chat in new tab
  const checkbox = document.getElementById("openInNewTab");
  checkbox.checked = JSON.parse(localStorage.getItem("openInNewTab")) || false;
  
  function updateCheckboxState() {
    localStorage.setItem("openInNewTab", checkbox.checked);
  }
  
  checkbox.addEventListener("change", updateCheckboxState);

  // Default chatGPT link
  browser.storage.local.get("chatgptLink").then(function (result) {
    var chatgptLink = result.chatgptLink;
    if (!chatgptLink) {
      chatgptLink = "https://chat.openai.com/chat"; // set to default value
      browser.storage.local.set({ chatgptLink: chatgptLink }); // save default value
    }
  });

  // OpenAI chatGPT link
  document.getElementById("OpenAIChatGPT").addEventListener("click", function () {
    var chatgptLink = "https://chat.openai.com/chat";
    browser.storage.local.set({ chatgptLink: chatgptLink });

    if (checkbox.checked) {
      browser.tabs.create({ url: chatgptLink });
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({ panel: chatgptLink });
    }
  });

  // GoogleBard link
  document.getElementById("GoogleBard").addEventListener("click", function () {
    var chatgptLink = "https://bard.google.com/";
    browser.storage.local.set({ chatgptLink: chatgptLink });

    if (checkbox.checked) {
      browser.tabs.create({ url: chatgptLink });
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({ panel: chatgptLink });
    }
  });

    // YouChat link
    document.getElementById("YouChat").addEventListener("click", function () {
      var chatgptLink = "https://you.com/search?q=hi&fromSearchBar=true&tbm=youchat";
      browser.storage.local.set({ chatgptLink: chatgptLink });
  
      if (checkbox.checked) {
        browser.tabs.create({ url: chatgptLink });
      } else {
        browser.sidebarAction.open();
        browser.sidebarAction.setPanel({ panel: chatgptLink });
      }
    });

      // PerplexityAi link
  document.getElementById("PerplexityAi").addEventListener("click", function () {
    var chatgptLink = "https://www.perplexity.ai/";
    browser.storage.local.set({ chatgptLink: chatgptLink });

    if (checkbox.checked) {
      browser.tabs.create({ url: chatgptLink });
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({ panel: chatgptLink });
    }
  });

  // Open prompt websites and chatGPT
  document.getElementById("prompts").addEventListener("click", function () {
    document.getElementById("menu").style.display = "none";
    document.getElementById("promptLinks").style.display = "block";
  });

  var linkElements = document.querySelectorAll("#promptLinks li");
  linkElements.forEach(function (linkElement) {
    var websiteUrl = linkElement.getAttribute("data-website");

    linkElement.addEventListener("click", function () {
      window.open(websiteUrl, "_blank");

    });
  });
});
