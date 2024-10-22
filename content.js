// content.js
let currentElement = null;
let helperButton = null;
let helperMenu = null;
let isMenuOpen = false;
let isProcessing = false;

function createHelperButton() {
  const button = document.createElement("button");
  button.className = "gemini-helper-button";
  button.textContent = "G";
  button.style.display = "none";
  document.body.appendChild(button);
  return button;
}

function createHelperMenu() {
  const menu = document.createElement("div");
  menu.className = "gemini-helper-menu";
  menu.style.display = "none";

  const grammarOption = document.createElement("div");
  grammarOption.className = "gemini-helper-menu-item";
  grammarOption.textContent = "Correct Grammar";
  grammarOption.onclick = (e) => {
    e.stopPropagation();
    processText(
      "correct grammar, only reply with the corrected phrase, without your comments. respond without parentheses on left and right sides. keep the original language"
    );
  };

  const clarityOption = document.createElement("div");
  clarityOption.className = "gemini-helper-menu-item";
  clarityOption.textContent = "Improve Clarity";
  clarityOption.onclick = (e) => {
    e.stopPropagation();
    processText(
      "rewrite for clarity, respond with ONLY the text, rewritten for clarity, no comments; keep the original language"
    );
  };

  menu.appendChild(grammarOption);
  menu.appendChild(clarityOption);
  document.body.appendChild(menu);
  return menu;
}

async function processText(prompt) {
  if (!currentElement) return;

  const text = currentElement.value || currentElement.textContent;
  if (!text) return;

  isProcessing = true;
  helperButton.textContent = "";
  helperButton.classList.add("gemini-helper-loading");
  closeMenu();

  try {
    const apiKey = await chrome.storage.sync.get("geminiApiKey");
    if (!apiKey.geminiApiKey) {
      alert("Please set your Gemini API key in the extension settings");
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${prompt}: ${text}` }],
            },
          ],
        }),
      }
    );

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    const improvedText = data.candidates[0].content.parts[0].text;

    if (currentElement.value !== undefined) {
      currentElement.value = improvedText;
    } else {
      currentElement.textContent = improvedText;
    }
  } catch (error) {
    console.error("Error processing text:", error);
    alert("Error processing text. Please try again.");
  } finally {
    helperButton.textContent = "G";
    helperButton.classList.remove("gemini-helper-loading");
    isProcessing = false;

    // Hide button if element is no longer focused
    if (document.activeElement !== currentElement) {
      hideHelper();
    }
  }
}

function updateHelperPosition(element) {
  if (!helperButton || !helperMenu || !element) return;

  const rect = element.getBoundingClientRect();
  const buttonSize = 32;

  const top = rect.top + window.scrollY;
  const left = rect.right + window.scrollX;

  helperButton.style.left = `${left - buttonSize - 8}px`;
  helperButton.style.top = `${top + 8}px`;
  helperButton.style.display = "flex";

  helperMenu.style.left = `${left - 150}px`;
  helperMenu.style.top = `${top + buttonSize + 8}px`;
}

function showHelper(element) {
  currentElement = element;
  updateHelperPosition(element);
}

function hideHelper() {
  if (isMenuOpen || isProcessing) return;
  helperButton.style.display = "none";
  closeMenu();
}

function openMenu() {
  if (!helperMenu) return;
  isMenuOpen = true;
  helperMenu.style.display = "block";
}

function closeMenu() {
  if (!helperMenu) return;
  isMenuOpen = false;
  helperMenu.style.display = "none";
}

function handleElementFocus(element) {
  if (element.tagName === "TEXTAREA" || element.tagName === "INPUT" || element.isContentEditable) {
    showHelper(element);
  }
}

function handleElementBlur(event) {
  // Check if the new focus target is our button or menu
  const relatedTarget = event.relatedTarget;
  if (
    relatedTarget &&
    (relatedTarget.closest(".gemini-helper-button") || relatedTarget.closest(".gemini-helper-menu"))
  ) {
    return;
  }

  // Use setTimeout to allow click events to process first
  setTimeout(() => {
    if (!isMenuOpen && !isProcessing) {
      hideHelper();
    }
  }, 100);
}

function handleScroll() {
  if (currentElement && helperButton.style.display !== "none") {
    updateHelperPosition(currentElement);
  }
}

function handleResize() {
  if (currentElement && helperButton.style.display !== "none") {
    updateHelperPosition(currentElement);
  }
}

function handleDocumentClick(e) {
  if (!e.target.closest(".gemini-helper-button") && !e.target.closest(".gemini-helper-menu")) {
    closeMenu();
    if (document.activeElement !== currentElement) {
      hideHelper();
    }
  }
}

function handleButtonClick(e) {
  e.stopPropagation();
  if (isMenuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

function initializeHelperElements() {
  try {
    helperButton = createHelperButton();
    helperMenu = createHelperMenu();

    document.addEventListener("focusin", (e) => handleElementFocus(e.target));
    document.addEventListener("focusout", handleElementBlur);
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    helperMenu.addEventListener("click", (e) => e.stopPropagation());
    helperButton.addEventListener("click", handleButtonClick);

    if (document.activeElement !== document.body) {
      handleElementFocus(document.activeElement);
    }

    console.log("Gemini Helper initialized successfully");
  } catch (error) {
    console.error("Error initializing Gemini Helper:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHelperElements);
} else {
  initializeHelperElements();
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processText") {
    processText(request.prompt);
  }
});
