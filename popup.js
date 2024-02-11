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
      browser.storage.local.set({chatgptLink: chatgptLink}); // save default value
    }
  });

  // OpenAI chatGPT link
  document
    .getElementById("OpenAIChatGPT")
    .addEventListener("click", function () {
      var chatgptLink = "https://chat.openai.com/chat";
      browser.storage.local.set({chatgptLink: chatgptLink});

      if (checkbox.checked) {
        browser.tabs.create({url: chatgptLink});
      } else {
        browser.sidebarAction.open();
        browser.sidebarAction.setPanel({panel: chatgptLink});
      }
    });

  // GoogleGemini link
  document.getElementById("GoogleGemini").addEventListener("click", function () {
    var chatgptLink = "https://gemini.google.com/app";
    browser.storage.local.set({chatgptLink: chatgptLink});

    if (checkbox.checked) {
      browser.tabs.create({url: chatgptLink});
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({panel: chatgptLink});
    }
  });

  // Copilot link
  document.getElementById("Copilot").addEventListener("click", function () {
    var chatgptLink = "https://copilot.microsoft.com/";
    browser.storage.local.set({chatgptLink: chatgptLink});

    if (checkbox.checked) {
      browser.tabs.create({url: chatgptLink});
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({panel: chatgptLink});
    }
  });

  // PerplexityAi link
  document
    .getElementById("PerplexityAi")
    .addEventListener("click", function () {
      var chatgptLink = "https://www.perplexity.ai/";
      browser.storage.local.set({chatgptLink: chatgptLink});

      if (checkbox.checked) {
        browser.tabs.create({url: chatgptLink});
      } else {
        browser.sidebarAction.open();
        browser.sidebarAction.setPanel({panel: chatgptLink});
      }
    });

  // YouChat link
  document.getElementById("YouChat").addEventListener("click", function () {
    var chatgptLink =
      "https://you.com/search?q=hi&fromSearchBar=true&tbm=youchat";
    browser.storage.local.set({chatgptLink: chatgptLink});

    if (checkbox.checked) {
      browser.tabs.create({url: chatgptLink});
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({panel: chatgptLink});
    }
  });

  // Bing Image link
  document.getElementById("BingImage").addEventListener("click", function () {
    var chatgptLink = "https://www.bing.com/images/create/";
    browser.storage.local.set({chatgptLink: chatgptLink}, function () {
      browser.tabs.create({url: chatgptLink});
    });
  });

  // Suno Music link
  document.getElementById("SunoMusic").addEventListener("click", function () {
    var chatgptLink = "https://app.suno.ai/create/";
    browser.storage.local.set({chatgptLink: chatgptLink});

    if (checkbox.checked) {
      browser.tabs.create({url: chatgptLink});
    } else {
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({panel: chatgptLink});
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
