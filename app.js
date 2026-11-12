(() => {
  const $ = selector => document.querySelector(selector);
  const state = {
    category: "All", query: "", favorites: [], recent: [], customServices: [],
    theme: "light", openInSidebar: false, defaultService: "chatgpt",
    promptCategory: "All", promptPage: 1, promptPageSize: 12, personalPrompts: [], license: {valid: false, features: []},
    researchProjects: [], activeResearchProjectId: "", telegramUsername: ""
  };

  const SUMMARY_INSTRUCTION = "Before summarizing, first ask me exactly: ‘In which language would you like the summary?’ Do not summarize yet. Wait for my answer. After I specify the language, summarize the source in that language. Start with a concise overview, then organize the main ideas, key facts, important dates or figures, and conclusions. Preserve the source’s meaning, distinguish facts from opinions, mention important uncertainty, and do not invent details.";

  function toast(message) {
    const element = $("#appToast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("visible"), 3000);
  }

  async function copyText(text) {
    if (!text) throw new Error("Nothing to copy");
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (_) {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("Clipboard unavailable");
    }
  }

  function allServices() {
    return [...AI_SERVICES, ...state.customServices];
  }

  function hasFeature(feature) {
    return Boolean(state.license.valid && state.license.features.includes(feature));
  }

  async function save(key, value) {
    return browser.storage.local.set({[key]: value});
  }

  async function loadState() {
    const saved = await browser.storage.local.get([
      "favorites", "recent", "customServices", "uiTheme", "openSitesInSidebarV22",
      "defaultService", "personalPrompts", "researchProjects", "activeResearchProjectId",
      "telegramUsername", "pendingExtensionAction"
    ]);
    state.favorites = Array.isArray(saved.favorites) ? saved.favorites : [];
    state.recent = Array.isArray(saved.recent) ? saved.recent : [];
    state.customServices = Array.isArray(saved.customServices) ? saved.customServices : [];
    // Light mode is the default; restore dark mode only when the user explicitly selected it.
    state.theme = saved.uiTheme === "dark" ? "dark" : "light";
    state.openInSidebar = saved.openSitesInSidebarV22 === true;
    state.defaultService = saved.defaultService || "chatgpt";
    state.personalPrompts = Array.isArray(saved.personalPrompts) ? saved.personalPrompts : [];
    state.researchProjects = Array.isArray(saved.researchProjects) ? saved.researchProjects : [];
    state.activeResearchProjectId = saved.activeResearchProjectId || "";
    state.telegramUsername = typeof saved.telegramUsername === "string" ? saved.telegramUsername : (AI_EVERYWHERE_CONFIG.telegramUsername || "");
    if (window.AILicense) state.license = await AILicense.getLicense();
    return saved.pendingExtensionAction || null;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const button = $("#themeToggle");
    if (button) button.textContent = state.theme === "dark" ? "☼" : "☾";
  }

  function switchView(viewName) {
    document.querySelectorAll("[data-view-panel]").forEach(panel => {
      panel.hidden = panel.dataset.viewPanel !== viewName;
    });
    document.querySelectorAll(".nav-tab[data-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.view === viewName);
    });
    if (viewName === "prompts") renderPrompts();
    if (viewName === "multi") renderMultiProviders();
    if (viewName === "research") renderResearchProjects();
    if (viewName === "pro") renderLicenseStatus();
  }

  function renderCategories() {
    const host = $("#categoryFilters");
    host.innerHTML = "";
    AI_CATEGORIES.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${state.category === category ? " active" : ""}`;
      button.textContent = category === "All" ? "All tools" : category;
      button.addEventListener("click", () => {
        state.category = category;
        renderCategories();
        renderServices();
      });
      host.appendChild(button);
    });
  }

  function renderServices() {
    const grid = $("#servicesGrid");
    const query = state.query.toLowerCase().trim();
    let services = allServices();
    if (state.category === "Custom") services = services.filter(item => item.custom === true);
    else if (state.category === "Favorites") services = services.filter(item => state.favorites.includes(item.id));
    else if (state.category === "Recent") {
      const map = new Map(services.map(item => [item.id, item]));
      services = state.recent.map(id => map.get(id)).filter(Boolean);
    } else if (state.category !== "All") {
      services = services.filter(item => item.category === state.category);
    }
    if (query) services = services.filter(item => `${item.name} ${item.category} ${item.description || ""}`.toLowerCase().includes(query));
    if (state.category === "Recent") {
      const order = new Map(state.recent.map((id, index) => [id, index]));
      services.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    } else {
      services.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name));
    }

    $("#resultCount").textContent = `${services.length} ${services.length === 1 ? "tool" : "tools"}`;
    $("#emptyState").hidden = services.length > 0;
    grid.replaceChildren();
    services.forEach(service => {
      const card = document.createElement("article");
      card.className = "service-card";
      const open = document.createElement("button");
      open.className = "service-main";
      open.type = "button";
      open.title = `Open ${service.name}`;
      const icon = document.createElement("span");
      icon.className = "service-icon";
      icon.textContent = service.icon || service.name.slice(0, 1).toUpperCase();
      const details = document.createElement("span");
      details.className = "service-details";
      const title = document.createElement("strong");
      title.textContent = service.name;
      const description = document.createElement("small");
      description.textContent = service.description || service.category;
      details.append(title, description);
      const arrow = document.createElement("span");
      arrow.className = "service-arrow";
      arrow.textContent = "↗";
      open.append(icon, details, arrow);
      open.addEventListener("click", () => openService(service));

      const favorite = document.createElement("button");
      favorite.className = `favorite-btn${state.favorites.includes(service.id) ? " is-favorite" : ""}`;
      favorite.type = "button";
      favorite.textContent = state.favorites.includes(service.id) ? "★" : "☆";
      favorite.title = state.favorites.includes(service.id) ? "Remove favorite" : "Add favorite";
      favorite.setAttribute("aria-label", favorite.title);
      favorite.addEventListener("click", () => toggleFavorite(service.id));
      card.append(open, favorite);

      if (service.custom) {
        const remove = document.createElement("button");
        remove.className = "remove-service-btn";
        remove.type = "button";
        remove.textContent = "×";
        remove.title = `Remove ${service.name}`;
        remove.setAttribute("aria-label", remove.title);
        remove.addEventListener("click", async () => {
          state.customServices = state.customServices.filter(item => item.id !== service.id);
          state.favorites = state.favorites.filter(id => id !== service.id);
          state.recent = state.recent.filter(id => id !== service.id);
          await browser.storage.local.set({customServices: state.customServices, favorites: state.favorites, recent: state.recent});
          renderServices();
          populateProviderSelects();
          toast(`${service.name} removed.`);
        });
        card.appendChild(remove);
      }
      grid.appendChild(card);
    });
  }

  function openHubInSidebar() {
    // Call both APIs before any await so Firefox still recognizes the toolbar click as a user gesture.
    const setPanel = browser.sidebarAction.setPanel({panel: browser.runtime.getURL("sidebar.html")});
    const openPanel = browser.sidebarAction.open();
    Promise.all([setPanel, openPanel]).then(() => {
      toast("AI Everywhere opened in Firefox Sidebar.");
    }).catch(error => {
      console.warn("Could not restore sidebar hub:", error);
      toast("Open AI Chat Everywhere from Firefox’s Sidebar menu.");
    });
  }

  function openService(service, options = {}) {
    if (!service || !service.url) return Promise.resolve();
    state.recent = [service.id, ...state.recent.filter(id => id !== service.id)].slice(0, 15);
    const persistRecent = save("recent", state.recent).catch(error => console.warn("Could not save recent tools:", error));

    // New tab is the default. The Sidebar preference is opt-in and explicitly selected by the user.
    if (options.forceTab || !state.openInSidebar) {
      return Promise.all([persistRecent, browser.tabs.create({url: service.url, active: true})])
        .catch(error => {
          console.warn("Could not open service in a new tab:", error);
          toast("Could not open this website. Check the address and try again.");
        });
    }

    // Do not await storage or setPanel before open(): Firefox requires open() to run
    // synchronously in the click handler's user-gesture call stack.
    try {
      const setPanel = browser.sidebarAction.setPanel({panel: service.url});
      const openPanel = browser.sidebarAction.open();
      return Promise.all([persistRecent, setPanel, openPanel]).then(() => {
        toast(`${service.name} opened in Firefox Sidebar.`);
      }).catch(error => {
        console.warn("Sidebar navigation unavailable; opening provider in a tab instead:", error);
        return browser.tabs.create({url: service.url, active: true}).then(() => {
          toast("This provider could not open in Sidebar, so it was opened in a tab.");
        });
      });
    } catch (error) {
      console.warn("Could not start Sidebar navigation:", error);
      return browser.tabs.create({url: service.url, active: true});
    }
  }

  async function toggleFavorite(id) {
    state.favorites = state.favorites.includes(id)
      ? state.favorites.filter(item => item !== id)
      : [id, ...state.favorites];
    await save("favorites", state.favorites);
    renderServices();
  }

  function normalizeWebsiteAddress(input) {
    let value = String(input || "").trim();
    value = value.replace(/^<|>$/g, "").replace(/^['\"]|['\"]$/g, "").trim();
    if (!value) throw new Error("Enter a website address.");
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
    let parsed;
    try { parsed = new URL(value); } catch (_) { throw new Error("This address still does not look like a website. Try example.com."); }
    if (!new Set(["http:", "https:"]).has(parsed.protocol)) throw new Error("Only http:// and https:// website addresses are supported.");
    if (!parsed.hostname || parsed.username || parsed.password) throw new Error("Enter a normal website address without login credentials.");
    if (/\s/.test(parsed.hostname)) throw new Error("Remove spaces from the website address.");
    return parsed.href;
  }

  async function addCustomService(event) {
    event.preventDefault();
    const name = $("#customName").value.trim();
    let url;
    try { url = normalizeWebsiteAddress($("#customUrl").value); }
    catch (error) { toast(error.message); return; }
    if (!name) { toast("Enter a name for this website."); return; }
    const duplicate = allServices().some(item => item.url.toLowerCase() === url.toLowerCase());
    if (duplicate) { toast("This website is already in your directory."); return; }
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    state.customServices.push({id, name, category: $("#customCategory").value, url, icon: name.slice(0, 2).toUpperCase(), description: "Custom AI website", custom: true});
    await save("customServices", state.customServices);
    $("#addServiceForm").reset();
    $("#addServicePanel").hidden = true;
    state.category = "Custom";
    renderCategories();
    renderServices();
    populateProviderSelects();
    toast(`${name} added to your directory.`);
  }

  function summaryPromptFor(text) {
    return `${SUMMARY_INSTRUCTION}\n\nSOURCE TEXT:\n${text || "[PAGE CONTENT WILL APPEAR HERE]"}`;
  }

  function refreshSummaryPrompt() {
    const source = $("#summarySource").value;
    $("#summaryPrompt").value = summaryPromptFor(source);
    $("#summarySourceCount").textContent = `${source.length.toLocaleString()} characters`;
  }

  async function readCurrentPage() {
    const button = $("#readCurrentPage");
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Reading current tab…";
    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      if (!tab || typeof tab.id !== "number") throw new Error("No active tab was found.");
      const results = await browser.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => ({
          title: document.title || "Current page",
          url: location.href,
          text: (document.body?.innerText || document.documentElement?.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 14000)
        })
      });
      const page = results?.[0]?.result;
      if (!page || page.text.length < 20) throw new Error("This page has too little readable text.");
      $("#summarySource").value = page.text;
      $("#summarySourceTitle").textContent = page.title;
      refreshSummaryPrompt();
      toast("Page text loaded. Copy the prompt or open an AI provider.");
    } catch (error) {
      console.warn("Page extraction failed:", error);
      toast("Firefox cannot read this page (protected pages, browser settings, and some PDFs are restricted). You can paste text manually.");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function populateProviderSelects() {
    const selectIds = ["#defaultServiceSelect", "#summaryProvider"];
    for (const selector of selectIds) {
      const select = $(selector);
      if (!select) continue;
      const previous = select.value;
      select.replaceChildren();
      allServices().forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = service.name;
        select.appendChild(option);
      });
      const preferred = selector === "#defaultServiceSelect" ? state.defaultService : (previous || state.defaultService);
      select.value = allServices().some(item => item.id === preferred) ? preferred : "chatgpt";
    }
  }

  async function openPromptInDefaultAI(prompt) {
    const service = allServices().find(item => item.id === state.defaultService) || AI_SERVICES[0];
    try {
      if (state.openInSidebar) {
        // Start clipboard access and sidebar navigation in the same click turn.
        const copying = copyText(prompt);
        const opening = openService(service);
        await Promise.all([copying, opening]);
      } else {
        // Copy first so the active popup is not dismissed before clipboard work completes.
        await copyText(prompt);
        await openService(service);
      }
      toast("Prompt copied. Paste it into the AI chat box.");
    } catch (error) {
      toast("Could not copy the prompt. Please select and copy it manually.");
    }
  }

  function getPromptItems() {
    const free = FREE_PROMPTS.map(item => ({...item, tier: "free"}));
    const personal = state.personalPrompts.map(item => ({...item, tier: "personal", personal: true}));
    const pro = PRO_PROMPTS.map(item => ({...item, tier: "pro", locked: !hasFeature("promptStudio")}));
    return [...free, ...personal, ...pro];
  }

  function renderPromptCategories(items) {
    const host = $("#promptCategoryFilters");
    if (!host) return;
    const categories = [...new Set(items.map(item => String(item.category || "Personal").replace(/^Pro\s*[·:-]\s*/i, "").trim()))].sort((a, b) => a.localeCompare(b));
    const choices = ["All", "My Prompts", ...categories.filter(category => category !== "Personal")];
    if (!choices.includes(state.promptCategory)) state.promptCategory = "All";
    host.replaceChildren();
    choices.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${state.promptCategory === category ? " active" : ""}`;
      button.textContent = category === "All" ? "All prompts" : category;
      button.addEventListener("click", () => {
        state.promptCategory = category;
        state.promptPage = 1;
        renderPrompts();
      });
      host.appendChild(button);
    });
  }

  function renderPromptPagination(totalPages, totalItems) {
    const host = $("#promptPagination");
    host.replaceChildren();
    if (totalItems <= state.promptPageSize) return;
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "button button-secondary";
    previous.textContent = "← Previous";
    previous.disabled = state.promptPage <= 1;
    previous.addEventListener("click", () => { state.promptPage -= 1; renderPrompts(); });
    const label = document.createElement("span");
    label.className = "page-indicator";
    label.textContent = `Page ${state.promptPage} of ${totalPages}`;
    const next = document.createElement("button");
    next.type = "button";
    next.className = "button button-secondary";
    next.textContent = "Next →";
    next.disabled = state.promptPage >= totalPages;
    next.addEventListener("click", () => { state.promptPage += 1; renderPrompts(); });
    host.append(previous, label, next);
  }

  function renderPrompts() {
    const host = $("#promptGrid");
    if (!host) return;
    const allItems = getPromptItems();
    renderPromptCategories(allItems);
    const query = $("#promptSearch").value.trim().toLowerCase();
    let items = allItems;
    if (state.promptCategory === "My Prompts") items = items.filter(item => item.personal);
    else if (state.promptCategory !== "All") {
      items = items.filter(item => String(item.category || "Personal").replace(/^Pro\s*[·:-]\s*/i, "").trim() === state.promptCategory);
    }
    if (query) items = items.filter(item => `${item.title} ${item.category} ${item.body}`.toLowerCase().includes(query));

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / state.promptPageSize));
    state.promptPage = Math.min(Math.max(1, state.promptPage), totalPages);
    const pageItems = items.slice((state.promptPage - 1) * state.promptPageSize, state.promptPage * state.promptPageSize);
    $("#promptCount").textContent = `${total} prompts · showing ${pageItems.length} · ${FREE_PROMPTS.length} free / ${PRO_PROMPTS.length} Pro templates`;
    host.replaceChildren();

    pageItems.forEach(item => {
      const card = document.createElement("article");
      card.className = `prompt-card${item.locked ? " is-locked" : ""}`;
      const tag = document.createElement("span");
      tag.className = "prompt-tag";
      if (item.tier === "pro") {
        tag.textContent = hasFeature("promptStudio") ? "PRO · ACTIVE" : "PRO · LOCKED";
        tag.classList.add(hasFeature("promptStudio") ? "pro-active" : "pro-locked");
      } else {
        tag.textContent = item.personal ? "MY PROMPT" : (item.category || "Free");
      }
      const title = document.createElement("h3");
      title.textContent = item.title;
      const body = document.createElement("p");
      body.textContent = item.body.length > 170 ? `${item.body.slice(0, 167)}…` : item.body;
      const actions = document.createElement("div");
      actions.className = "prompt-card-actions";
      const use = document.createElement("button");
      use.className = "button button-secondary";
      use.type = "button";
      use.textContent = item.locked ? "Unlock Pro" : "Use prompt";
      use.addEventListener("click", () => {
        if (item.locked) { switchView("pro"); toast("This premium template is included with Complete Pro."); return; }
        openPromptComposer(item);
      });
      actions.appendChild(use);
      if (item.personal) {
        const remove = document.createElement("button");
        remove.className = "button danger-button";
        remove.type = "button";
        remove.textContent = "Delete";
        remove.addEventListener("click", async () => {
          state.personalPrompts = state.personalPrompts.filter(prompt => prompt.id !== item.id);
          await save("personalPrompts", state.personalPrompts);
          renderPrompts();
          toast("Personal prompt deleted.");
        });
        actions.appendChild(remove);
      }
      card.append(tag, title, body, actions);
      host.appendChild(card);
    });
    if (!pageItems.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No prompts match this category and search.";
      host.appendChild(empty);
    }
    renderPromptPagination(totalPages, total);
    updatePromptStudioControls();
  }

  function updatePromptStudioControls() {
    const active = hasFeature("promptStudio");
    const label = active ? "PRO · ACTIVE" : "PRO · LOCKED";
    ["promptStudioToolsStatus", "exportPromptsStatus", "importPromptsStatus"].forEach(id => {
      const node = document.getElementById(id);
      if (!node) return;
      node.textContent = label;
      node.classList.toggle("active", active);
    });
    const price = AI_EVERYWHERE_CONFIG.completeProPriceLabel || "Contact us on Telegram for current pricing";
    const line = active ? "Included with your active Complete Pro license." : `Complete Pro access · ${price}`;
    $("#promptStudioPriceLine").textContent = line;
    $("#promptStudioLock").hidden = active;
    $("#exportPrompts").disabled = !active;
    $("#importPromptsButton").disabled = !active;
  }

  function openPromptComposer(prompt) {
    const compose = $("#promptCompose");
    compose.hidden = false;
    $("#promptComposeTitle").textContent = prompt.title;
    $("#promptOutput").value = prompt.body;
    const host = $("#promptVariables");
    host.replaceChildren();
    const variables = [...new Set([...prompt.body.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map(match => match[1]))];
    if (variables.length && !hasFeature("promptStudio")) {
      toast("Variable-based templates are part of Prompt Studio Pro.");
      switchView("pro");
      compose.hidden = true;
      return;
    }
    if (variables.length) {
      variables.forEach(variable => {
        const label = document.createElement("label");
        label.textContent = variable.replace(/_/g, " ");
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.promptVariable = variable;
        input.placeholder = `Enter ${variable.replace(/_/g, " ")}`;
        label.appendChild(input);
        host.appendChild(label);
      });
      const apply = document.createElement("button");
      apply.type = "button";
      apply.className = "button button-secondary";
      apply.textContent = "Apply variables";
      apply.addEventListener("click", () => {
        const values = {};
        host.querySelectorAll("input[data-prompt-variable]").forEach(input => values[input.dataset.promptVariable] = input.value.trim());
        $("#promptOutput").value = prompt.body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (all, key) => values[key] || `[${key}]`);
      });
      host.appendChild(apply);
    }
    compose.scrollIntoView({behavior: "smooth", block: "nearest"});
  }

  async function addPersonalPrompt(event) {
    event.preventDefault();
    const title = $("#newPromptTitle").value.trim();
    const body = $("#newPromptBody").value.trim();
    if (!title || !body) return;
    state.personalPrompts.unshift({id: `personal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title, category: $("#newPromptCategory").value, body});
    await save("personalPrompts", state.personalPrompts);
    event.target.reset();
    renderPrompts();
    toast("Your prompt was saved on this device.");
  }

  async function exportPersonalPrompts() {
    if (!hasFeature("promptStudio")) { switchView("pro"); toast("Export is included with Complete Pro."); return; }
    const payload = {
      format: "ai-chat-everywhere-prompts-v2",
      exportedAt: new Date().toISOString(),
      prompts: state.personalPrompts.map(item => ({title: item.title, category: item.category || "Personal", body: item.body}))
    };
    try {
      await downloadText("ai-chat-everywhere-my-prompts.json", JSON.stringify(payload, null, 2), "application/json");
      toast(`${payload.prompts.length} personal prompts exported.`);
    } catch (error) {
      console.error("Prompt export failed:", error);
      toast(error.message || "Could not export your prompts.");
    }
  }

  function readFileAsText(file) {
    if (typeof file.text === "function") return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsText(file);
    });
  }

  async function importPersonalPrompts(file) {
    if (!hasFeature("promptStudio")) { switchView("pro"); return; }
    try {
      if (!file || file.size <= 0) throw new Error("Choose a non-empty JSON file.");
      if (file.size > 5 * 1024 * 1024) throw new Error("Import file must be smaller than 5 MB.");
      const parsed = JSON.parse(await readFileAsText(file));
      const imported = Array.isArray(parsed) ? parsed : parsed?.prompts;
      if (!Array.isArray(imported) || imported.length > 500) throw new Error("Unsupported prompt file. Use a JSON export from AI Chat Everywhere.");

      const clean = imported.map(item => {
        if (!item || typeof item.title !== "string" || typeof item.body !== "string") return null;
        const title = item.title.trim().slice(0, 70);
        const body = item.body.trim().slice(0, 12000);
        if (!title || !body) return null;
        return {id: `personal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`, title, category: String(item.category || "Personal").trim().slice(0, 40) || "Personal", body};
      }).filter(Boolean);
      if (!clean.length) throw new Error("No valid prompts were found in this file.");

      const existingKeys = new Set(state.personalPrompts.map(item => `${item.title.trim().toLowerCase()}|${item.body.trim()}`));
      const unique = clean.filter(item => {
        const key = `${item.title.trim().toLowerCase()}|${item.body.trim()}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
      const available = Math.max(0, 500 - state.personalPrompts.length);
      const added = unique.slice(0, available);
      if (!added.length) throw new Error("No new prompts to import. They may already exist or the 500-prompt limit was reached.");
      state.personalPrompts = [...added, ...state.personalPrompts];
      await save("personalPrompts", state.personalPrompts);
      state.promptCategory = "My Prompts";
      state.promptPage = 1;
      renderPrompts();
      toast(`${added.length} prompts imported. ${clean.length - unique.length} duplicates skipped.`);
    } catch (error) {
      console.warn("Prompt import failed:", error);
      toast(error.message || "Could not import this prompt file.");
    } finally {
      $("#importPromptsFile").value = "";
    }
  }

  function renderMultiProviders() {
    const gate = $("#multiGate");
    const workspace = $("#multiWorkspace");
    const unlocked = hasFeature("multiChat");
    gate.hidden = unlocked;
    workspace.hidden = !unlocked;
    if (!unlocked) return;
    const host = $("#multiProviderList");
    const chatServices = allServices().filter(item => item.category === "Chat");
    host.replaceChildren();
    chatServices.forEach(service => {
      const label = document.createElement("label");
      label.className = "provider-check";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = service.id;
      checkbox.checked = ["chatgpt", "claude", "gemini"].includes(service.id);
      const name = document.createElement("span");
      name.textContent = service.name;
      label.append(checkbox, name);
      host.appendChild(label);
    });
  }

  async function launchMultiChat() {
    if (!hasFeature("multiChat")) { switchView("pro"); return; }
    const prompt = $("#multiPrompt").value.trim();
    const selectedIds = [...$("#multiProviderList").querySelectorAll("input:checked")].map(input => input.value);
    if (prompt.length < 2) { toast("Enter a prompt first."); return; }
    if (selectedIds.length < 2) { toast("Select at least two AI providers."); return; }
    try {
      await copyText(prompt);
      const map = new Map(allServices().map(service => [service.id, service]));
      const selected = selectedIds.map(id => map.get(id)).filter(Boolean);
      for (let index = 0; index < selected.length; index += 1) {
        await browser.tabs.create({url: selected[index].url, active: index === 0});
      }
      toast(`${selected.length} AI tabs opened. The shared prompt is copied to your clipboard.`);
    } catch (error) {
      console.warn("Multi-chat launch failed:", error);
      toast("Could not open all selected AI tabs.");
    }
  }

  async function ensureResearchProject() {
    if (!state.researchProjects.length) {
      const project = {id: `research-${Date.now()}`, name: "My Research", sources: [], updatedAt: Date.now()};
      state.researchProjects = [project];
      state.activeResearchProjectId = project.id;
      await browser.storage.local.set({researchProjects: state.researchProjects, activeResearchProjectId: state.activeResearchProjectId});
    }
    if (!state.researchProjects.some(project => project.id === state.activeResearchProjectId)) state.activeResearchProjectId = state.researchProjects[0].id;
  }

  function activeResearchProject() {
    return state.researchProjects.find(project => project.id === state.activeResearchProjectId) || null;
  }

  async function renderResearchProjects() {
    const unlocked = hasFeature("webResearch");
    $("#researchGate").hidden = unlocked;
    $("#researchWorkspace").hidden = !unlocked;
    if (!unlocked) return;
    await ensureResearchProject();
    const select = $("#researchProjectSelect");
    select.replaceChildren();
    state.researchProjects.forEach(project => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      select.appendChild(option);
    });
    select.value = state.activeResearchProjectId;
    renderResearchSources();
  }

  function renderResearchSources() {
    const project = activeResearchProject();
    const host = $("#researchSources");
    host.replaceChildren();
    const sources = project?.sources || [];
    $("#researchSourceCount").textContent = `${sources.length} ${sources.length === 1 ? "source" : "sources"}`;
    if (!sources.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No sources yet. Open a web page and click “Save current page to project”.";
      host.appendChild(empty);
      return;
    }
    sources.slice().reverse().forEach(source => {
      const row = document.createElement("article");
      row.className = "research-source-card";
      const title = document.createElement("strong");
      title.textContent = source.title || source.url || "Untitled source";
      const url = document.createElement("a");
      url.href = source.url;
      url.target = "_blank";
      url.rel = "noreferrer";
      url.textContent = source.url;
      const meta = document.createElement("small");
      meta.textContent = `${(source.text || "").length.toLocaleString()} characters · ${new Date(source.savedAt).toLocaleString()}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button danger-text";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeResearchSource(source.id));
      row.append(title, url, meta, remove);
      host.appendChild(row);
    });
  }

  async function addCurrentPageToResearch() {
    if (!hasFeature("webResearch")) { switchView("pro"); return; }
    const button = $("#addResearchPage");
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Saving page text…";
    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      if (!tab || typeof tab.id !== "number") throw new Error("No active tab found.");
      const results = await browser.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => ({
          title: document.title || "Untitled page",
          url: location.href,
          text: (document.body?.innerText || document.documentElement?.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 9000)
        })
      });
      const page = results?.[0]?.result;
      if (!page || page.text.length < 40) throw new Error("Not enough readable page text was found.");
      const project = activeResearchProject();
      if (!project) throw new Error("Create or select a research project first.");
      const existing = project.sources.findIndex(source => source.url === page.url);
      const entry = {id: existing >= 0 ? project.sources[existing].id : `source-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: page.title, url: page.url, text: page.text, savedAt: Date.now()};
      if (existing >= 0) project.sources[existing] = entry;
      else project.sources.push(entry);
      project.sources = project.sources.slice(-20);
      project.updatedAt = Date.now();
      await save("researchProjects", state.researchProjects);
      renderResearchSources();
      toast("Page source saved locally to this project.");
    } catch (error) {
      console.warn("Could not add research page:", error);
      toast("Could not read this tab. Protected pages cannot be collected; try a normal website.");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  async function createResearchProject() {
    if (!hasFeature("webResearch")) { switchView("pro"); return; }
    const name = $("#newResearchProjectName").value.trim();
    if (!name) { toast("Enter a project name."); return; }
    if (state.researchProjects.length >= 25) { toast("This browser can store up to 25 research projects."); return; }
    const project = {id: `research-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: name.slice(0, 60), sources: [], updatedAt: Date.now()};
    state.researchProjects.unshift(project);
    state.activeResearchProjectId = project.id;
    await browser.storage.local.set({researchProjects: state.researchProjects, activeResearchProjectId: state.activeResearchProjectId});
    $("#newResearchProjectName").value = "";
    await renderResearchProjects();
    toast("Research project created.");
  }

  async function removeResearchSource(sourceId) {
    const project = activeResearchProject();
    if (!project) return;
    project.sources = project.sources.filter(source => source.id !== sourceId);
    await save("researchProjects", state.researchProjects);
    renderResearchSources();
  }

  function buildResearchPrompt(project) {
    const sources = project?.sources || [];
    const sourceText = sources.map((source, index) => `SOURCE ${index + 1}\nTitle: ${source.title}\nURL: ${source.url}\nCaptured: ${new Date(source.savedAt).toISOString()}\nContent:\n${source.text}`).join("\n\n---\n\n");
    return `You are helping me synthesize a research collection. First ask me which language I want for the final report and wait for my answer. Then analyze the sources below. Separate facts from interpretation, compare agreements and disagreements, cite claims using the source number and URL, identify missing evidence and limitations, and never invent citations or details.\n\nPROJECT: ${project?.name || "Research"}\nNUMBER OF SOURCES: ${sources.length}\n\nCOLLECTED SOURCES:\n${sourceText || "[NO SOURCES COLLECTED YET]"}`;
  }

  async function copyResearchPrompt() {
    const project = activeResearchProject();
    if (!project || !project.sources.length) { toast("Add at least one source first."); return; }
    try { await copyText(buildResearchPrompt(project)); toast("Research prompt copied. Paste it into an AI website."); }
    catch (_) { toast("Could not copy the research prompt."); }
  }

  async function downloadText(filename, content, mimeType = "text/plain") {
    // Use a standard Blob URL download. This needs no downloads API and no
    // optional/host permission, so Firefox users won't see a permission prompt.
    const blob = new Blob([content], {type: `${mimeType};charset=utf-8`});
    if (blob.size > 5 * 1024 * 1024) throw new Error("Export is larger than the 5 MB safety limit.");
    if (!URL.createObjectURL || typeof document.createElement("a").download === "undefined") {
      throw new Error("This browser could not create a local file download. Update Firefox and try again.");
    }
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = String(filename || "ai-chat-everywhere-export.txt").replace(/[\\/:*?"<>|]+/g, "-");
    anchor.style.position = "fixed";
    anchor.style.left = "-10000px";
    anchor.setAttribute("aria-hidden", "true");
    document.body.appendChild(anchor);
    try {
      // Keep the click in the same user-action chain as the Export button.
      anchor.click();
    } finally {
      anchor.remove();
      // Firefox may finish starting the download after the popup has closed.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }
  }

  function exportResearchMarkdown() {
    const project = activeResearchProject();
    if (!project || !project.sources.length) { toast("Add at least one source first."); return; }
    const body = `# ${project.name}\n\nExported from AI Chat Everywhere on ${new Date().toLocaleString()}\n\n` + project.sources.map((source, index) => `## ${index + 1}. ${source.title}\n\n- URL: ${source.url}\n- Saved: ${new Date(source.savedAt).toLocaleString()}\n\n${source.text}\n`).join("\n---\n\n");
    downloadText(`${project.name.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 45) || "research"}.md`, body, "text/markdown")
      .then(() => toast("Research Markdown export started."))
      .catch(error => { console.warn("Research Markdown export failed:", error); toast(error.message || "Could not export this research project."); });
  }

  async function exportResearchBackup() {
    if (!hasFeature("webResearch")) { switchView("pro"); return; }
    if (!state.researchProjects.length) { toast("There are no research projects to export."); return; }
    const payload = {
      format: "ai-chat-everywhere-research-v1",
      exportedAt: new Date().toISOString(),
      projects: state.researchProjects.map(project => ({
        name: project.name,
        updatedAt: project.updatedAt || Date.now(),
        sources: (project.sources || []).map(source => ({
          title: source.title || "Untitled source",
          url: source.url,
          text: source.text || "",
          savedAt: source.savedAt || Date.now()
        }))
      }))
    };
    try {
      await downloadText("ai-chat-everywhere-research-backup.json", JSON.stringify(payload, null, 2), "application/json");
      toast(`${payload.projects.length} research projects exported.`);
    } catch (error) {
      console.warn("Research backup export failed:", error);
      toast(error.message || "Could not export research backup.");
    }
  }

  async function importResearchBackup(file) {
    if (!hasFeature("webResearch")) { switchView("pro"); return; }
    try {
      if (!file || file.size <= 0) throw new Error("Choose a non-empty JSON backup file.");
      if (file.size > 5 * 1024 * 1024) throw new Error("Research backup must be smaller than 5 MB.");
      const parsed = JSON.parse(await readFileAsText(file));
      const imported = Array.isArray(parsed) ? parsed : parsed?.projects;
      if (!Array.isArray(imported) || imported.length > 25) throw new Error("Unsupported research backup. Choose a JSON file exported by AI Chat Everywhere.");

      const cleanProjects = [];
      for (const rawProject of imported) {
        if (!rawProject || typeof rawProject.name !== "string" || !Array.isArray(rawProject.sources)) continue;
        const name = rawProject.name.trim().slice(0, 60);
        if (!name) continue;
        const sources = [];
        const seenUrls = new Set();
        for (const rawSource of rawProject.sources.slice(0, 20)) {
          if (!rawSource || typeof rawSource.url !== "string" || typeof rawSource.text !== "string") continue;
          let parsedUrl;
          try { parsedUrl = new URL(rawSource.url); } catch (_) { continue; }
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) continue;
          const normalizedUrl = parsedUrl.href;
          if (seenUrls.has(normalizedUrl)) continue;
          seenUrls.add(normalizedUrl);
          const text = rawSource.text.trim().slice(0, 9000);
          if (!text) continue;
          const savedAtValue = Number(rawSource.savedAt);
          sources.push({
            id: `source-import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            title: String(rawSource.title || "Untitled source").trim().slice(0, 180) || "Untitled source",
            url: normalizedUrl,
            text,
            savedAt: Number.isFinite(savedAtValue) && savedAtValue > 0 ? savedAtValue : Date.now()
          });
        }
        cleanProjects.push({
          id: `research-import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          sources,
          updatedAt: Date.now()
        });
      }
      if (!cleanProjects.length) throw new Error("No valid research projects were found in this file.");
      const available = Math.max(0, 25 - state.researchProjects.length);
      const added = cleanProjects.slice(0, available);
      if (!added.length) throw new Error("This browser already has the maximum of 25 research projects.");

      // Keep existing projects intact. Give imported projects a distinct name when needed.
      const existingNames = new Set(state.researchProjects.map(project => String(project.name || "").toLowerCase()));
      for (const project of added) {
        const original = project.name;
        let candidate = original;
        let suffix = 2;
        while (existingNames.has(candidate.toLowerCase())) {
          candidate = `${original.slice(0, 52)} (Imported ${suffix++})`;
        }
        project.name = candidate;
        existingNames.add(candidate.toLowerCase());
      }
      state.researchProjects = [...added, ...state.researchProjects];
      state.activeResearchProjectId = added[0].id;
      await browser.storage.local.set({researchProjects: state.researchProjects, activeResearchProjectId: state.activeResearchProjectId});
      await renderResearchProjects();
      toast(`${added.length} research projects imported. Existing projects were kept.`);
    } catch (error) {
      console.warn("Research backup import failed:", error);
      toast(error.message || "Could not import this research backup.");
    } finally {
      const input = $("#importResearchFile");
      if (input) input.value = "";
    }
  }

  async function refreshLicenseUI() {
    state.license = await AILicense.getLicense();
    renderLicenseStatus();
    renderPrompts();
    renderMultiProviders();
    renderResearchProjects();
  }

  function renderLicenseStatus() {
    const complete = state.license.valid && ["promptStudio", "multiChat", "webResearch"].every(feature => state.license.features.includes(feature));
    const status = $("#completeProStatus");
    if (status) {
      status.textContent = complete ? "PRO · ACTIVE" : (state.license.valid ? "LEGACY LICENSE" : "PRO · LOCKED");
      status.classList.toggle("active", complete);
    }
    $("#licenseStatusMessage").textContent = state.license.valid
      ? `Active: ${state.license.plan}. ${complete ? "All Complete Pro features are unlocked." : `Legacy license features: ${state.license.features.join(", ")}.` } ${state.license.expiresAt ? `Expires ${new Date(state.license.expiresAt).toLocaleDateString()}.` : "Lifetime license."}`
      : (state.license.reason || "No Pro license activated.");
    const price = AI_EVERYWHERE_CONFIG.completeProPriceLabel || "Contact us on Telegram for current pricing";
    $("#completeProPriceLine").textContent = complete ? "Complete Pro is active on this browser." : `One purchase unlocks every Pro feature · ${price}`;
    updatePromptStudioControls();
    const telegramInput = $("#telegramUsernameInput");
    if (telegramInput && document.activeElement !== telegramInput) telegramInput.value = state.telegramUsername.replace(/^@/, "");
  }

  async function activateLicense() {
    const code = $("#licenseCodeInput").value.trim();
    if (!code) { toast("Paste your activation code first."); return; }
    try {
      const result = await AILicense.verifyCode(code);
      if (!result.valid) {
        $("#licenseStatusMessage").textContent = result.reason || "Invalid activation code.";
        toast("Activation code is invalid.");
        return;
      }
      await save("signedLicenseCode", code);
      $("#licenseCodeInput").value = "";
      await refreshLicenseUI();
      toast("Your Pro features are now activated.");
    } catch (error) {
      console.error("License activation failed:", error);
      toast("Could not verify this activation code in this browser.");
    }
  }

  async function deactivateLicense() {
    await browser.storage.local.remove("signedLicenseCode");
    state.license = {valid: false, features: []};
    await refreshLicenseUI();
    toast("Pro license deactivated on this device.");
  }

  function currentTelegramUsername() {
    const username = String(state.telegramUsername || AI_EVERYWHERE_CONFIG.telegramUsername || "").trim().replace(/^@/, "");
    if (!username || username === "YOUR_TELEGRAM_USERNAME" || /[^a-zA-Z0-9_]/.test(username)) return "";
    return username;
  }

  async function contactTelegram() {
    const username = currentTelegramUsername();
    if (!username) {
      toast("The publisher has not configured a Telegram username yet. Update config.js before publishing.");
      switchView("pro");
      return;
    }
    const message = "Hello. I would like to purchase AI Chat Everywhere Complete Pro, which unlocks all premium features with one activation code. Please send me the payment details.";
    const url = `https://t.me/${encodeURIComponent(username)}?text=${encodeURIComponent(message)}`;
    await browser.tabs.create({url, active: true});
  }

  async function saveTelegramSetting() {
    const value = $("#telegramUsernameInput").value.trim().replace(/^@/, "");
    if (value && !/^[a-zA-Z0-9_]{5,32}$/.test(value)) { toast("Enter a valid Telegram username (5–32 letters, numbers, or underscores)."); return; }
    state.telegramUsername = value;
    await save("telegramUsername", value);
    toast("Telegram support username saved on this device.");
  }

  function bindEvents() {
    document.querySelectorAll(".nav-tab[data-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
    document.querySelectorAll("[data-go-pro]").forEach(button => button.addEventListener("click", () => switchView("pro")));
    document.querySelectorAll("[data-contact-feature]").forEach(button => button.addEventListener("click", () => contactTelegram()));

    $("#themeToggle").addEventListener("click", async () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      await save("uiTheme", state.theme);
      applyTheme();
    });
    $("#sidebarButton").addEventListener("click", openHubInSidebar);
    $("#searchInput").addEventListener("input", event => { state.query = event.target.value; renderServices(); });
    $("#searchInput").addEventListener("keydown", event => {
      if (event.key === "Escape") { event.target.value = ""; state.query = ""; renderServices(); }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        if (!$("#view-tools").hidden) $("#searchInput").focus();
        else if (!$("#view-prompts").hidden) $("#promptSearch").focus();
      }
    });
    $("#addServiceToggle").addEventListener("click", () => { $("#addServicePanel").hidden = !$("#addServicePanel").hidden; });
    $("#closeAddService").addEventListener("click", () => { $("#addServicePanel").hidden = true; });
    $("#addServiceForm").addEventListener("submit", addCustomService);
    $("#openSitesInSidebar").checked = state.openInSidebar;
    $("#openSitesInSidebar").addEventListener("change", async event => {
      state.openInSidebar = event.target.checked;
      await save("openSitesInSidebarV22", state.openInSidebar);
      toast(state.openInSidebar ? "AI websites will open in Firefox Sidebar." : "AI websites will open in a new tab.");
    });
    $("#defaultServiceSelect").addEventListener("change", async event => { state.defaultService = event.target.value; await save("defaultService", state.defaultService); toast("Default AI updated."); });
    $("#goSummarize").addEventListener("click", () => switchView("summarize"));
    $("#goPrompts").addEventListener("click", () => switchView("prompts"));

    $("#readCurrentPage").addEventListener("click", readCurrentPage);
    $("#summarySource").addEventListener("input", refreshSummaryPrompt);
    $("#copySummaryPrompt").addEventListener("click", async () => {
      try { await copyText($("#summaryPrompt").value); toast("Summary prompt copied."); }
      catch (_) { toast("Could not copy the prompt."); }
    });
    $("#openSummaryProvider").addEventListener("click", async () => {
      const service = allServices().find(item => item.id === $("#summaryProvider").value);
      const prompt = $("#summaryPrompt").value;
      try {
        if (state.openInSidebar) {
          const copying = copyText(prompt);
          const opening = openService(service);
          await Promise.all([copying, opening]);
        } else {
          await copyText(prompt);
          await openService(service);
        }
        toast("Prompt copied. Paste it into the AI chat.");
      } catch (_) { toast("Could not copy the prompt or open the AI website."); }
    });

    $("#promptSearch").addEventListener("input", () => { state.promptPage = 1; renderPrompts(); });
    $("#addPromptForm").addEventListener("submit", addPersonalPrompt);
    $("#closePromptCompose").addEventListener("click", () => { $("#promptCompose").hidden = true; });
    $("#copyPromptOutput").addEventListener("click", async () => { try { await copyText($("#promptOutput").value); toast("Prompt copied."); } catch (_) { toast("Could not copy prompt."); } });
    $("#openPromptOutput").addEventListener("click", () => openPromptInDefaultAI($("#promptOutput").value));
    $("#exportPrompts").addEventListener("click", exportPersonalPrompts);
    $("#importPromptsButton").addEventListener("click", () => hasFeature("promptStudio") ? $("#importPromptsFile").click() : switchView("pro"));
    $("#importPromptsFile").addEventListener("change", event => { const file = event.target.files?.[0]; if (file) importPersonalPrompts(file); });

    $("#launchMultiChat").addEventListener("click", launchMultiChat);
    $("#copyMultiPrompt").addEventListener("click", async () => { try { await copyText($("#multiPrompt").value); toast("Prompt copied."); } catch (_) { toast("Enter a prompt first."); } });

    $("#createResearchProject").addEventListener("click", createResearchProject);
    $("#researchProjectSelect").addEventListener("change", async event => { state.activeResearchProjectId = event.target.value; await save("activeResearchProjectId", state.activeResearchProjectId); renderResearchSources(); });
    $("#addResearchPage").addEventListener("click", addCurrentPageToResearch);
    $("#copyResearchPrompt").addEventListener("click", copyResearchPrompt);
    $("#exportResearchMarkdown").addEventListener("click", exportResearchMarkdown);
    $("#exportResearchBackup").addEventListener("click", exportResearchBackup);
    $("#importResearchButton").addEventListener("click", () => hasFeature("webResearch") ? $("#importResearchFile").click() : switchView("pro"));
    $("#importResearchFile").addEventListener("change", event => { const file = event.target.files?.[0]; if (file) importResearchBackup(file); });

    $("#activateLicense").addEventListener("click", activateLicense);
    $("#removeLicense").addEventListener("click", deactivateLicense);
    $("#saveTelegramUsername").addEventListener("click", saveTelegramSetting);
  }

  async function init() {
    const pendingAction = await loadState();
    applyTheme();
    renderCategories();
    renderServices();
    populateProviderSelects();
    bindEvents();
    refreshSummaryPrompt();
    renderPrompts();
    renderMultiProviders();
    renderLicenseStatus();
    if (pendingAction && Date.now() - Number(pendingAction.createdAt || 0) < 10 * 60 * 1000) {
      if (pendingAction.task === "summarize") {
        $("#summarySource").value = String(pendingAction.text || "").slice(0, 9000);
        $("#summarySourceTitle").textContent = pendingAction.title || "Selected text";
        refreshSummaryPrompt();
        switchView("summarize");
      } else if (pendingAction.task === "research") {
        switchView("research");
        if (hasFeature("webResearch") && String(pendingAction.text || "").trim()) {
          await ensureResearchProject();
          const project = activeResearchProject();
          project.sources.push({
            id: `source-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: pendingAction.title || "Selected text",
            url: pendingAction.url || "",
            text: String(pendingAction.text).slice(0, 9000),
            savedAt: Date.now()
          });
          project.sources = project.sources.slice(-20);
          project.updatedAt = Date.now();
          await save("researchProjects", state.researchProjects);
          await renderResearchProjects();
          toast("Selected text added to your research project.");
        } else if (!hasFeature("webResearch")) {
          toast("Web Research Pro is required to save selected text into a project.");
        }
      }
      await browser.storage.local.remove("pendingExtensionAction");
    }
    // An activeTab read is deliberately not attempted on startup. It only happens after a visible user click.
  }

  init().catch(error => {
    console.error("AI Chat Everywhere initialization failed:", error);
    toast("The extension could not initialize. Try reloading it in about:addons.");
  });
})();
