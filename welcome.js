document.getElementById("saveKey").addEventListener("click", async () => {
  const apiKey = document.getElementById("apiKey").value;
  const status = document.getElementById("status");

  if (!apiKey) {
    status.textContent = "Please enter an API key";
    status.className = "status error";
    return;
  }

  try {
    // Validate API key with a test request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Test" }],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      await chrome.storage.sync.set({ geminiApiKey: apiKey });
      status.textContent = "API key saved successfully! You can close this tab and start using the extension.";
      status.className = "status success";
    } else {
      throw new Error("Invalid API key");
    }
  } catch (error) {
    status.textContent = "Invalid API key. Please check and try again.";
    status.className = "status error";
  }
});
