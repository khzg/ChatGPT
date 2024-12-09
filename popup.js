document.addEventListener("DOMContentLoaded", function () {
  // Open chat in new tab
  const checkbox = document.getElementById("openInNewTab");
  checkbox.checked = JSON.parse(localStorage.getItem("openInNewTab")) || false;

  function updateCheckboxState() {
    localStorage.setItem("openInNewTab", checkbox.checked);
  }
  checkbox.addEventListener("change", updateCheckboxState);


  let listItems = document.querySelectorAll("li");
  listItems.forEach((li) => {
    li.addEventListener("click", function () {
      let website = this.getAttribute("data-website");

      if (checkbox.checked) {
        browser.tabs.create({url: website});
      } else {
        browser.sidebarAction.open();
        browser.sidebarAction.setPanel({panel: website});
      }
    });
  });

  const linksToRemove = [
    "https://gemini.google.com/app",
];

// Function to remove specific URLs from history
async function deleteHistory() {
  for (const url of linksToRemove) {
      try {
          await browser.history.deleteUrl({ url });
          console.log(`Deleted history for ${url}`);
      } catch (error) {
          console.error(`Failed to delete ${url}:`, error);
      }
  }
}

// Call the function when the extension is loaded
deleteHistory();
});

