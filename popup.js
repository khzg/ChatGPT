document.addEventListener("DOMContentLoaded", function () {
  //default chatGPT link
  browser.storage.local.get("chatgptLink").then(function (result) {
    var chatgptLink = result.chatgptLink;
    if (!chatgptLink) {
      // check if chatgptLink is empty
      chatgptLink = "https://chat.openai.com/chat"; // set to default value
      browser.storage.local.set({chatgptLink: chatgptLink}); // save default value to
    }
  });

  //OpenAI chatGPT link
  document
    .getElementById("OpenAIChatGPT")
    .addEventListener("click", function () {
      var chatgptLink = "https://chat.openai.com/chat";
      browser.storage.local.set({chatgptLink: chatgptLink});
      browser.sidebarAction.open();
      browser.sidebarAction.setPanel({panel: chatgptLink});
    });

  /*
    //GoogleBard chatGPT link
    document.getElementById('GoogleBard').addEventListener('click', function() {
    var chatgptLink = "https://google.com";
    browser.storage.local.set({ "chatgptLink": chatgptLink });
    browser.sidebarAction.open();
    browser.sidebarAction.setPanel({ panel: chatgptLink });
  });
  */

  //open promptLinks menu
  document.getElementById("prompts").addEventListener("click", function () {
    document.getElementById("menu").style.display = "none";
    document.getElementById("promptLinks").style.display = "block";
  });

  //open prompt websites
  var linkElements = document.querySelectorAll("#promptLinks li");

  linkElements.forEach(function (linkElement) {
    var websiteUrl = linkElement.getAttribute("data-website");

    linkElement.addEventListener("click", function () {
      window.open(websiteUrl, "_blank");

      browser.sidebarAction.open();
      browser.storage.local.get("chatgptLink").then(function (result) {
        var chatgptLink = result.chatgptLink;
        browser.sidebarAction.setPanel({panel: chatgptLink});
      });
    });
  });
});
