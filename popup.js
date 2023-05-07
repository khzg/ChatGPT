document.addEventListener('DOMContentLoaded', function() {

  //default chatGPT link
  browser.storage.local.get("chatgptLink").then(function(result) {
    var chatgptLink = result.chatgptLink;
    if (!chatgptLink) { // check if chatgptLink is empty
      chatgptLink = "https://chat.openai.com/chat"; // set to default value
      browser.storage.local.set({ "chatgptLink": chatgptLink }); // save default value to 
    }
  });
  

    //OpenAI chatGPT link
  document.getElementById('OpenAIChatGPT').addEventListener('click', function() {
    var chatgptLink = "https://chat.openai.com/chat";
    browser.storage.local.set({ "chatgptLink": chatgptLink });
    browser.sidebarAction.open();
    browser.sidebarAction.setPanel({ panel: chatgptLink });
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
 
    //prompts
    const promptsLink = document.getElementById("prompts");

    promptsLink.addEventListener("click", () => {
    window.open("http://www.creativewritingprompts.com", "_blank");
   });

});
