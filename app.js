(() => {
  const $ = selector => document.querySelector(selector);
  const state = {
    category: "All", query: "", favorites: [], recent: [], customServices: [],
    theme: "light", openInSidebar: false, defaultService: "chatgpt",
    promptCategory: "All", promptPage: 1, promptPageSize: 12, personalPrompts: [], license: {valid: false, features: []},
    researchProjects: [], activeResearchProjectId: "",
    savedConversations: [], conversationFolders: ["General", "Work", "Research", "Coding", "Learning"],
    chatQuery: "", chatStatusFilter: "active", chatFolderFilter: "all", youtubeVideoUrl: ""
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
      "savedConversations", "conversationFolders", "pendingExtensionAction"
    ]);
    state.favorites = Array.isArray(saved.favorites) ? saved.favorites : [];
    state.recent = Array.isArray(saved.recent) ? saved.recent : [];
    state.customServices = Array.isArray(saved.customServices) ? saved.customServices : [];
    // Light mode is the default; restore dark mode only when the user explicitly selected it.
    state.theme = saved.uiTheme === "dark" ? "dark" : saved.uiTheme === "light" ? "light" : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    state.openInSidebar = saved.openSitesInSidebarV22 === true;
    state.defaultService = saved.defaultService || "chatgpt";
    state.personalPrompts = Array.isArray(saved.personalPrompts) ? saved.personalPrompts : [];
    state.researchProjects = Array.isArray(saved.researchProjects) ? saved.researchProjects : [];
    state.activeResearchProjectId = saved.activeResearchProjectId || "";
    state.savedConversations = Array.isArray(saved.savedConversations) ? saved.savedConversations : [];
    state.conversationFolders = Array.isArray(saved.conversationFolders) && saved.conversationFolders.length
      ? saved.conversationFolders : ["General", "Work", "Research", "Coding", "Learning"];
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
    if (viewName === "chats") renderConversations();
    if (viewName === "youtube") prepareYouTubeAssistant();
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
    $("#addServiceToggle").focus();
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

  // --- YouTube AI: prepare a link-based Gemini workflow without fetching transcripts or using an AI API. ---
  async function prepareYouTubeAssistant() {
    const status = $("#youtubeStatus");
    if (!status) return;
    const hint = $("#youtubeMissingHint");
    status.textContent = "Checking the active browser tab…";
    $("#youtubeVideoUrl").textContent = "Checking current tab…";
    $("#youtubePrompt").value = "";
    $("#youtubeCopyPrompt").disabled = true;
    $("#youtubeOpenGemini").disabled = true;
    state.youtubeVideoUrl = "";
    if (hint) hint.hidden = false;

    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      if (!tab?.url) throw new Error("No active tab URL.");
      const url = new URL(tab.url);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const isYouTubeHost = host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
      const hasVideoId = (host === "youtu.be" && url.pathname.length > 1)
        || (url.pathname === "/watch" && Boolean(url.searchParams.get("v")))
        || /^\/(shorts|live|embed)\/[^/]+/.test(url.pathname);
      if (!isYouTubeHost || !hasVideoId) {
        status.textContent = "No YouTube video is active. Open a video in your browser, then return to YouTube AI and press Refresh.";
        $("#youtubeVideoUrl").textContent = "No YouTube video detected.";
        return;
      }

      state.youtubeVideoUrl = url.href;
      $("#youtubeVideoUrl").textContent = state.youtubeVideoUrl;
      if (hint) hint.hidden = true;
      status.textContent = "Video detected. Choose your response language to prepare a Gemini prompt for this video.";
      updateYouTubePrompt();
    } catch (error) {
      console.warn("Could not detect the active YouTube video:", error);
      status.textContent = "Could not read the active tab. Open a YouTube video in your browser, then press Refresh.";
      $("#youtubeVideoUrl").textContent = "No YouTube video detected.";
    }
  }

  function updateYouTubePrompt() {
    const language = $("#youtubeLanguage").value;
    if (!state.youtubeVideoUrl) {
      $("#youtubePrompt").value = "Open a YouTube video in your browser, then return here and press Refresh.";
      $("#youtubeCopyPrompt").disabled = true;
      $("#youtubeOpenGemini").disabled = true;
      return;
    }
    if (!language) {
      $("#youtubePrompt").value = "Choose your preferred language above. The prepared prompt will ask Gemini to inspect this video link, explain which actions it can genuinely perform, and ask you to choose one.";
      $("#youtubeCopyPrompt").disabled = true;
      $("#youtubeOpenGemini").disabled = true;
      return;
    }

    const languageInstruction = language === "Other"
      ? "Ask me which language I prefer, then continue in that language."
      : `My preferred language is ${language}. Use ${language} for your response and all follow-up questions.`;
    const prompt = `I want to work with this YouTube video.\n\nVIDEO URL:\n${state.youtubeVideoUrl}\n\nLANGUAGE:\n${languageInstruction}\n\nFIRST, inspect this exact video link and determine what you can genuinely do with the video in this Gemini session, based on the video, transcript, and tools you can actually access right now. Do not assume that every capability is available.\n\nIn my preferred language, explain the useful actions you can perform on THIS video. Consider options such as: a short or detailed summary, chapter/section outline, key ideas, detailed explanation of selected topics, study notes, practical steps, terminology explanations, quiz or questions, extracting claims for fact-checking, and timestamp-based references only when you can verify the timestamps. Include only the actions you can really perform with the access available.\n\nThen ask me which one I want. Do not start summarizing or analyzing yet; wait for me to choose. If you cannot access the video or its transcript, tell me clearly and ask me to provide a transcript or another accessible source. Never invent video content, quotations, or timestamps.`;
    $("#youtubePrompt").value = prompt;
    $("#youtubeCopyPrompt").disabled = false;
    $("#youtubeOpenGemini").disabled = false;
  }

  async function openYouTubePromptInGemini() {
    const prompt = $("#youtubePrompt").value.trim();
    if (!prompt || !state.youtubeVideoUrl) return;
    try {
      await copyText(prompt);
      await browser.tabs.create({url: "https://gemini.google.com/app", active: true});
      toast("Prompt copied. Paste it into Gemini to explore the available video actions.");
    } catch (error) {
      console.warn("Could not open Gemini for the YouTube prompt:", error);
      toast("Could not copy the prompt or open Gemini.");
    }
  }

  // --- Smart right-click actions: all results are shown inside this extension page. ---
  const QUICK_ACTIONS = {
    translate: {
      title: "Translate selected text",
      prompt: text => `Translate the following text. First ask me which target language I want, then wait for my answer. Preserve the meaning, tone, names, and formatting. Do not add commentary unless needed.\n\nTEXT:\n${text}`
    },
    explain: {
      title: "Explain selected text",
      prompt: text => `Explain the following text clearly. Start with a plain-language explanation, define important terms, then give a brief example if useful. Do not invent facts.\n\nTEXT:\n${text}`
    },
    rewrite: {
      title: "Rewrite selected text",
      prompt: text => `Rewrite the following text to make it clearer, more natural, and well structured while preserving its original meaning. If the intended tone is unclear, ask me whether I prefer a professional, friendly, concise, or persuasive tone before rewriting.\n\nTEXT:\n${text}`
    },
    grammar: {
      title: "Fix grammar and spelling",
      prompt: text => `Correct the grammar, spelling, punctuation, and awkward phrasing in the following text. Preserve the original meaning and language. Return the corrected version first, followed by a short list of important corrections only if useful.\n\nTEXT:\n${text}`
    },
    simplify: {
      title: "Simplify selected text",
      prompt: text => `Rewrite the following text in simpler, easier-to-understand language. Keep the important information and meaning, explain unavoidable technical terms, and do not omit essential details.\n\nTEXT:\n${text}`
    },
    keypoints: {
      title: "Extract key points",
      prompt: text => `Extract the key points from the following text. Organize them into concise bullets, preserve important facts and numbers, and distinguish the source's claims from verified facts.\n\nTEXT:\n${text}`
    },
    questions: {
      title: "Generate questions from text",
      prompt: text => `Create useful questions based only on the following text. Include a mix of comprehension and deeper-thinking questions. Put the answer key in a separate section and do not introduce facts that are absent from the text.\n\nTEXT:\n${text}`
    },
    ask: {
      title: "Ask AI about selected text",
      prompt: text => `Read the following selected text. Briefly identify its subject and ask me what I would like to understand, verify, compare, or do with it. Do not assume my goal.\n\nTEXT:\n${text}`
    }
  };

  let handledPendingActionIds = new Set();
  let appIsReady = false;
  let queuedPendingAction = null;

  async function consumePendingExtensionAction(pending) {
    if (!pending) return;
    if (Date.now() - Number(pending.createdAt || 0) >= 10 * 60 * 1000) {
      const latestExpired = await browser.storage.local.get("pendingExtensionAction");
      if (latestExpired.pendingExtensionAction && latestExpired.pendingExtensionAction.id === pending.id) {
        await browser.storage.local.remove("pendingExtensionAction");
      }
      return;
    }
    const key = String(pending.id || pending.createdAt || "");
    if (key && handledPendingActionIds.has(key)) return;
    if (key) handledPendingActionIds.add(key);

    const selected = String(pending.text || "").trim();
    if (pending.task === "summarize") {
      $("#summarySource").value = selected.slice(0, 12000);
      $("#summarySourceTitle").textContent = pending.title || "Selected text";
      refreshSummaryPrompt();
      switchView("summarize");
      toast("Selected text is ready in the extension window.");
    } else if (pending.task === "quick-action") {
      const action = QUICK_ACTIONS[pending.action] || QUICK_ACTIONS.ask;
      $("#quickActionHeading").textContent = action.title;
      $("#quickActionMeta").textContent = pending.url ? `Selected from ${pending.url}` : "Selected text is kept in this extension window.";
      $("#quickActionSource").value = selected.slice(0, 12000);
      $("#quickActionPrompt").value = action.prompt(selected.slice(0, 12000));
      switchView("quick-action");
      toast("Prepared prompt is ready. No browser tab was opened.");
    } else if (pending.task === "research") {
      switchView("research");
      if (hasFeature("webResearch") && selected) {
        await ensureResearchProject();
        const project = activeResearchProject();
        project.sources.push({
          id: `source-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: pending.title || "Selected text",
          url: pending.url || "",
          text: selected.slice(0, 9000),
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

    const latest = await browser.storage.local.get("pendingExtensionAction");
    if (latest.pendingExtensionAction && String(latest.pendingExtensionAction.id || latest.pendingExtensionAction.createdAt || "") === key) {
      await browser.storage.local.remove("pendingExtensionAction");
    }
  }

  // --- Local conversation manager. No provider account/API access is used. ---
  const MAX_SAVED_CONVERSATIONS = 500;
  const MAX_CONVERSATION_TEXT = 18000;

  function providerFromUrl(value) {
    try {
      const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
      if (host === "chatgpt.com" || host.endsWith(".openai.com")) return "ChatGPT";
      if (host === "claude.ai") return "Claude";
      if (host === "gemini.google.com") return "Gemini";
      if (host === "grok.com" || host.endsWith(".x.com")) return "Grok";
      if (host.includes("copilot.microsoft.com")) return "Copilot";
      if (host.includes("deepseek.com")) return "DeepSeek";
      if (host.includes("perplexity.ai")) return "Perplexity";
      return "Web AI";
    } catch (_) { return "Web AI"; }
  }

  async function saveCurrentConversation() {
    const button = $("#saveCurrentConversation");
    const oldLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Reading current chat…";
    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      if (!tab || typeof tab.id !== "number" || !tab.url) throw new Error("No active website tab was found.");
      const results = await browser.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => {
          const host = location.hostname.toLowerCase().replace(/^www\./, "");
          let provider = "Web AI";
          if (host === "chatgpt.com" || host.endsWith(".openai.com")) provider = "ChatGPT";
          else if (host === "claude.ai") provider = "Claude";
          else if (host === "gemini.google.com") provider = "Gemini";
          else if (host === "grok.com") provider = "Grok";
          else if (host.includes("copilot.microsoft.com")) provider = "Copilot";
          else if (host.includes("deepseek.com")) provider = "DeepSeek";
          else if (host.includes("perplexity.ai")) provider = "Perplexity";

          let selectors = "";
          if (provider === "ChatGPT") selectors = "[data-message-author-role]";
          else if (provider === "Claude") selectors = '[data-testid*="conversation-turn"], .font-claude-message';
          else if (provider === "Gemini") selectors = "user-query, model-response, message-content, .model-response-text";
          else selectors = '[data-message-author-role], [data-testid*="message"], article';

          const elements = selectors ? Array.from(document.querySelectorAll(selectors)) : [];
          const seen = new Set();
          const messages = elements.map(element => {
            const text = (element.innerText || element.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
            if (!text || seen.has(text)) return "";
            seen.add(text);
            const role = element.getAttribute("data-message-author-role") || element.getAttribute("data-testid") || "";
            return role ? `[${role}] ${text}` : text;
          }).filter(Boolean);
          let conversationText = messages.join("\n\n");
          if (conversationText.length < 30) {
            const main = document.querySelector("main") || document.body;
            conversationText = (main?.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
          }
          const heading = document.querySelector("main h1, main [role='heading'], header h1");
          let title = (heading?.innerText || document.title || "Saved conversation").trim();
          title = title.replace(/\s*[-|]\s*(ChatGPT|Claude|Gemini|Grok).*$/i, "").slice(0, 180);
          return {
            provider,
            title: title || "Saved conversation",
            url: location.href,
            text: conversationText.slice(0, 18000),
            pageTitle: document.title || ""
          };
        }
      });
      const captured = results?.[0]?.result;
      if (!captured || !captured.text || captured.text.length < 30) {
        throw new Error("No readable chat messages were found. Open the conversation and make sure its messages are visible.");
      }
      const record = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        provider: captured.provider || providerFromUrl(captured.url),
        title: captured.title || "Saved conversation",
        url: captured.url,
        text: captured.text.slice(0, MAX_CONVERSATION_TEXT),
        preview: captured.text.slice(0, 240).replace(/\s+/g, " "),
        folder: "General",
        tags: [],
        pinned: false,
        archived: false,
        source: "Saved from current tab",
        savedAt: Date.now(),
        updatedAt: Date.now()
      };
      upsertConversation(record);
      await save("savedConversations", state.savedConversations);
      renderConversations();
      toast("Current conversation saved locally.");
    } catch (error) {
      console.warn("Could not save the current conversation:", error);
      toast(error.message || "Could not read this conversation. Try opening the chat first.");
    } finally {
      button.disabled = false;
      button.textContent = oldLabel;
    }
  }

  function upsertConversation(record) {
    const existingIndex = state.savedConversations.findIndex(item => item.url && record.url && item.url === record.url);
    if (existingIndex >= 0) {
      const existing = state.savedConversations[existingIndex];
      state.savedConversations[existingIndex] = {
        ...existing,
        ...record,
        id: existing.id,
        folder: existing.folder || record.folder || "General",
        tags: Array.isArray(existing.tags) ? existing.tags : [],
        pinned: Boolean(existing.pinned),
        archived: Boolean(existing.archived)
      };
    } else {
      state.savedConversations.unshift(record);
    }
    state.savedConversations = state.savedConversations.slice(0, MAX_SAVED_CONVERSATIONS);
  }

  function renderConversations() {
    const host = $("#conversationList");
    if (!host) return;
    host.replaceChildren();

    const folderSelect = $("#chatFolderFilter");
    if (folderSelect) {
      const current = state.chatFolderFilter || "all";
      folderSelect.replaceChildren();
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "All folders";
      folderSelect.appendChild(allOption);
      state.conversationFolders.forEach(folder => {
        const option = document.createElement("option");
        option.value = folder;
        option.textContent = folder;
        folderSelect.appendChild(option);
      });
      folderSelect.value = ["all", ...state.conversationFolders].includes(current) ? current : "all";
      state.chatFolderFilter = folderSelect.value;
    }

    const query = state.chatQuery.trim().toLowerCase();
    let conversations = state.savedConversations.filter(item => {
      const isArchived = Boolean(item.archived);
      if (state.chatStatusFilter === "active" && isArchived) return false;
      if (state.chatStatusFilter === "archived" && !isArchived) return false;
      if (state.chatStatusFilter === "pinned" && (!item.pinned || isArchived)) return false;
      if (state.chatFolderFilter !== "all" && (item.folder || "General") !== state.chatFolderFilter) return false;
      const searchable = `${item.title || ""} ${item.provider || ""} ${item.text || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
      return !query || searchable.includes(query);
    });
    conversations.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || Number(b.updatedAt || b.savedAt || 0) - Number(a.updatedAt || a.savedAt || 0));
    $("#chatCount").textContent = `${conversations.length} ${conversations.length === 1 ? "conversation" : "conversations"}`;
    $("#chatEmptyState").hidden = conversations.length > 0;

    conversations.forEach(item => {
      const card = document.createElement("article");
      card.className = `conversation-card${item.pinned ? " is-pinned" : ""}${item.archived ? " is-archived" : ""}`;
      const header = document.createElement("div");
      header.className = "conversation-card-header";
      const titleBox = document.createElement("div");
      titleBox.className = "conversation-title-box";
      const title = document.createElement("h3");
      title.textContent = item.title || "Untitled conversation";
      const meta = document.createElement("small");
      const date = Number(item.updatedAt || item.savedAt || 0);
      meta.textContent = `${item.provider || "AI"} · ${date ? new Date(date).toLocaleString() : "Saved"}${item.pinned ? " · Pinned" : ""}${item.archived ? " · Archived" : ""}`;
      titleBox.append(title, meta);
      const open = document.createElement("button");
      open.className = "button button-secondary conversation-open";
      open.type = "button";
      open.textContent = "Open";
      open.disabled = !/^https?:/i.test(item.url || "");
      open.addEventListener("click", () => openConversation(item));
      header.append(titleBox, open);
      const preview = document.createElement("p");
      preview.className = "conversation-preview";
      preview.textContent = item.preview || (item.text || "").slice(0, 240);
      const controls = document.createElement("div");
      controls.className = "conversation-controls";

      const folderLabel = document.createElement("label");
      folderLabel.className = "chat-inline-field";
      folderLabel.textContent = "Folder";
      const folder = document.createElement("select");
      folder.setAttribute("aria-label", `Folder for ${item.title || "conversation"}`);
      state.conversationFolders.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        folder.appendChild(option);
      });
      folder.value = state.conversationFolders.includes(item.folder) ? item.folder : "General";
      folder.addEventListener("change", () => updateConversation(item.id, {folder: folder.value}));
      folderLabel.appendChild(folder);

      const tagsLabel = document.createElement("label");
      tagsLabel.className = "chat-inline-field chat-tags-field";
      tagsLabel.textContent = "Tags";
      const tags = document.createElement("input");
      tags.type = "text";
      tags.maxLength = 160;
      tags.value = (Array.isArray(item.tags) ? item.tags : []).join(", ");
      tags.placeholder = "work, idea, follow-up";
      tags.setAttribute("aria-label", `Tags for ${item.title || "conversation"}`);
      tags.addEventListener("change", () => {
        const parsed = [...new Set(tags.value.split(",").map(value => value.trim().slice(0, 30)).filter(Boolean))].slice(0, 12);
        updateConversation(item.id, {tags: parsed});
      });
      tagsLabel.appendChild(tags);
      controls.append(folderLabel, tagsLabel);

      const actions = document.createElement("div");
      actions.className = "conversation-actions";
      const actionButton = (label, handler, extraClass = "") => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `text-button ${extraClass}`.trim();
        button.textContent = label;
        button.addEventListener("click", handler);
        return button;
      };
      actions.append(
        actionButton(item.pinned ? "Unpin" : "Pin", () => updateConversation(item.id, {pinned: !item.pinned})),
        actionButton(item.archived ? "Restore" : "Archive", () => updateConversation(item.id, {archived: !item.archived})),
        actionButton("Rename", () => renameConversation(item)),
        actionButton("Delete", () => deleteConversation(item.id), "danger-text")
      );

      const details = document.createElement("details");
      details.className = "conversation-details";
      const summary = document.createElement("summary");
      summary.textContent = "View saved messages";
      const content = document.createElement("pre");
      content.textContent = item.text || "No message text was saved.";
      details.append(summary, content);
      card.append(header, preview, controls, actions, details);
      host.appendChild(card);
    });
  }

  async function updateConversation(id, patch) {
    const item = state.savedConversations.find(chat => chat.id === id);
    if (!item) return;
    Object.assign(item, patch, {updatedAt: Date.now()});
    await save("savedConversations", state.savedConversations);
    renderConversations();
  }

  function showConversationDialog(mode, item) {
    const dialog = $("#conversationDialog");
    const input = $("#conversationDialogInput");
    const field = $("#conversationDialogField");
    const title = $("#conversationDialogTitle");
    const description = $("#conversationDialogDescription");
    const confirm = $("#conversationDialogConfirm");
    if (!dialog || typeof dialog.showModal !== "function") {
      toast("This browser does not support the conversation dialog.");
      return;
    }
    dialog.dataset.mode = mode;
    dialog.dataset.conversationId = item.id;
    if (mode === "rename") {
      title.textContent = "Rename conversation";
      description.textContent = "Choose a short, recognizable title. Your saved messages will stay unchanged.";
      field.hidden = false;
      input.required = true;
      input.value = item.title || "";
      confirm.textContent = "Save changes";
      confirm.classList.remove("button-danger");
      confirm.classList.add("button-primary");
    } else {
      title.textContent = "Delete conversation?";
      description.textContent = `“${item.title || "This conversation"}” will be removed from this browser’s local library. This cannot be undone.`;
      field.hidden = true;
      input.required = false;
      input.value = "";
      confirm.textContent = "Delete conversation";
      confirm.classList.remove("button-primary");
      confirm.classList.add("button-danger");
    }
    dialog.showModal();
    if (mode === "rename") input.select();
    else $("#conversationDialogCancel").focus();
  }

  function renameConversation(item) {
    showConversationDialog("rename", item);
  }

  function deleteConversation(id) {
    const item = state.savedConversations.find(chat => chat.id === id);
    if (item) showConversationDialog("delete", item);
  }

  async function confirmConversationDialog(event) {
    event.preventDefault();
    const dialog = $("#conversationDialog");
    const mode = dialog.dataset.mode;
    const id = dialog.dataset.conversationId;
    const item = state.savedConversations.find(chat => chat.id === id);
    if (!item) { dialog.close(); return; }

    if (mode === "rename") {
      const title = $("#conversationDialogInput").value.trim().slice(0, 180);
      if (!title) { toast("A conversation title cannot be empty."); $("#conversationDialogInput").focus(); return; }
      await updateConversation(id, {title});
      toast("Conversation renamed.");
    } else if (mode === "delete") {
      state.savedConversations = state.savedConversations.filter(chat => chat.id !== id);
      await save("savedConversations", state.savedConversations);
      renderConversations();
      toast("Conversation deleted from this browser.");
    }
    dialog.close();
  }

  async function openConversation(item) {
    try {
      const [tab] = await browser.tabs.query({active: true, currentWindow: true});
      if (tab?.id && /^https?:/i.test(item.url || "")) {
        await browser.tabs.update(tab.id, {url: item.url, active: true});
      } else {
        toast("This conversation does not have an openable link.");
      }
    } catch (error) {
      console.warn("Could not open the saved conversation:", error);
      toast("Could not open this conversation link.");
    }
  }

  async function createConversationFolder(event) {
    event.preventDefault();
    const input = $("#newChatFolderName");
    const name = input.value.trim().slice(0, 40);
    if (!name) return;
    if (state.conversationFolders.some(folder => folder.toLowerCase() === name.toLowerCase())) {
      toast("That folder already exists.");
      return;
    }
    if (state.conversationFolders.length >= 30) { toast("The folder limit is 30."); return; }
    state.conversationFolders.push(name);
    await save("conversationFolders", state.conversationFolders);
    input.value = "";
    renderConversations();
    toast("Folder created.");
  }

  async function exportConversationLibrary() {
    const payload = {
      format: "ai-chat-everywhere-conversation-library-v1",
      exportedAt: new Date().toISOString(),
      folders: state.conversationFolders,
      conversations: state.savedConversations
    };
    try {
      await downloadText("ai-chat-everywhere-conversations.json", JSON.stringify(payload, null, 2), "application/json");
      toast(`${state.savedConversations.length} conversations exported.`);
    } catch (error) {
      console.warn("Conversation library export failed:", error);
      toast(error.message || "Could not export the conversation library.");
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
      ? `Active: ${state.license.plan}. ${complete ? "All Complete Pro features are unlocked." : `Legacy license features: ${state.license.features.join(", ")}.` } ${state.license.expiresAt ? `Expires ${new Date(state.license.expiresAt).toLocaleDateString()}.` : "No expiry date recorded."}`
      : (state.license.reason || "No Pro license activated.");
    const price = AI_EVERYWHERE_CONFIG.completeProPriceLabel || "$4 / 3 months";
    $("#completeProPriceLine").textContent = complete ? "Complete Pro is active on this browser." : `Complete Pro access · ${price}`;
    updatePromptStudioControls();
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
    const username = String(AI_EVERYWHERE_CONFIG.telegramUsername || "").trim().replace(/^@/, "");
    if (!username || /[^a-zA-Z0-9_]/.test(username)) return "";
    return username;
  }

  async function contactTelegram() {
    const username = currentTelegramUsername();
    if (!username) {
      toast("Telegram contact is not configured.");
      return;
    }
    const message = "Hello. I would like details about the 3-month AI Chat Everywhere Complete Pro access.";
    const url = `https://t.me/${encodeURIComponent(username)}?text=${encodeURIComponent(message)}`;
    await browser.tabs.create({url, active: true});
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
        else if (!$("#view-chats").hidden) $("#chatSearch").focus();
      }
    });
    $("#addServiceToggle").addEventListener("click", () => {
      $("#addServicePanel").hidden = false;
      requestAnimationFrame(() => $("#customName").focus());
    });
    const closeAddServiceDialog = () => {
      $("#addServicePanel").hidden = true;
      $("#addServiceToggle").focus();
    };
    $("#closeAddService").addEventListener("click", closeAddServiceDialog);
    $("#addServicePanel").addEventListener("click", event => {
      if (event.target === $("#addServicePanel")) closeAddServiceDialog();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !$("#addServicePanel").hidden) closeAddServiceDialog();
    });
    $("#addServiceForm").addEventListener("submit", addCustomService);
    $("#openSitesInSidebar").checked = state.openInSidebar;
    $("#openSitesInSidebar").addEventListener("change", async event => {
      state.openInSidebar = event.target.checked;
      await save("openSitesInSidebarV22", state.openInSidebar);
      toast(state.openInSidebar ? "AI websites will open in Firefox Sidebar." : "AI websites will open in a new tab.");
    });
    $("#defaultServiceSelect").addEventListener("change", async event => { state.defaultService = event.target.value; await save("defaultService", state.defaultService); toast("Default AI updated."); });
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

    $("#copyQuickActionPrompt").addEventListener("click", async () => {
      try { await copyText($("#quickActionPrompt").value); toast("Prepared action prompt copied."); }
      catch (_) { toast("Could not copy the prompt."); }
    });

    $("#youtubeRefresh").addEventListener("click", prepareYouTubeAssistant);
    $("#youtubeLanguage").addEventListener("change", updateYouTubePrompt);
    $("#youtubeCopyPrompt").addEventListener("click", async () => {
      try { await copyText($("#youtubePrompt").value); toast("YouTube prompt copied. Paste it into Gemini."); }
      catch (_) { toast("Could not copy the YouTube prompt."); }
    });
    $("#youtubeOpenGemini").addEventListener("click", openYouTubePromptInGemini);

    $("#saveCurrentConversation").addEventListener("click", saveCurrentConversation);
    $("#conversationDialogForm").addEventListener("submit", confirmConversationDialog);
    $("#conversationDialogCancel").addEventListener("click", () => $("#conversationDialog").close());
    $("#conversationDialogClose").addEventListener("click", () => $("#conversationDialog").close());
    $("#exportConversations").addEventListener("click", exportConversationLibrary);
    $("#chatSearch").addEventListener("input", event => { state.chatQuery = event.target.value; renderConversations(); });
    $("#chatStatusFilter").addEventListener("change", event => { state.chatStatusFilter = event.target.value; renderConversations(); });
    $("#chatFolderFilter").addEventListener("change", event => { state.chatFolderFilter = event.target.value; renderConversations(); });
    $("#newChatFolderForm").addEventListener("submit", createConversationFolder);

    $("#activateLicense").addEventListener("click", activateLicense);
    $("#removeLicense").addEventListener("click", deactivateLicense);
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
    appIsReady = true;
    if (queuedPendingAction || pendingAction) await consumePendingExtensionAction(queuedPendingAction || pendingAction);
    // An activeTab read is deliberately not attempted on startup. It only happens after a visible user click.
  }

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.pendingExtensionAction?.newValue) {
      if (!appIsReady) {
        queuedPendingAction = changes.pendingExtensionAction.newValue;
        return;
      }
      consumePendingExtensionAction(changes.pendingExtensionAction.newValue).catch(error => {
        console.warn("Could not display the selected-text action:", error);
      });
    }
  });

  init().catch(error => {
    console.error("AI Chat Everywhere initialization failed:", error);
    toast("The extension could not initialize. Try reloading it in about:addons.");
  });
})();
