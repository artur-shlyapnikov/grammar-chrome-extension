chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "geminiGrammarHelper",
    title: "Gemini Grammar Helper",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "correctGrammar",
    parentId: "geminiGrammarHelper",
    title: "Correct Grammar",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "improveClarify",
    parentId: "geminiGrammarHelper",
    title: "Improve Clarity",
    contexts: ["editable"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const prompt = info.menuItemId === "correctGrammar" ? "correct grammar" : "rewrite for clarity";
  chrome.tabs.sendMessage(tab.id, { action: "processText", prompt });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "welcome.html",
    });
  }
});
