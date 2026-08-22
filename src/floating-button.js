(() => {
  const buttonId = "bionify-floating-button";
  const styleId = "bionify-floating-style";

  function removeButton() {
    document.getElementById(buttonId)?.remove();
    document.getElementById(styleId)?.remove();
  }

  function updateButtonState(isOn) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    button.classList.toggle("bionify-on", Boolean(isOn));
    button.title = isOn ? "Bionify: On" : "Bionify: Off";
    button.setAttribute("aria-label", isOn ? "Bionify: On" : "Bionify: Off");
  }

  function syncButtonState() {
    updateButtonState(document.getElementById("bionify-style-id") !== null);
  }

  function sendToggleMessage() {
    try {
      const button = document.getElementById(buttonId);
      if (
        typeof chrome === "undefined" ||
        !chrome.runtime ||
        typeof chrome.runtime.sendMessage !== "function"
      ) {
        if (button) button.title = "Bionify: reload this page after reloading the extension";
        return;
      }
      const result = chrome.runtime.sendMessage({ type: "toggle-bionify" });
      result?.catch?.(() => {
        if (button) button.title = "Bionify: reload this page after reloading the extension";
      });
    } catch {
      // The extension context can disappear while an already-injected button remains.
      const button = document.getElementById(buttonId);
      if (button) button.title = "Bionify: reload this page after reloading the extension";
    }
  }

  function hasChromeStorage() {
    return (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.sync
    );
  }

  function observeRenderState() {
    if (window.bionifyFloatingObserver) return;
    const observer = new MutationObserver(() => {
      updateButtonState(document.getElementById("bionify-style-id") !== null);
    });
    observer.observe(document.head || document.documentElement, {
      childList: true,
      subtree: true,
    });
    window.bionifyFloatingObserver = observer;
  }

  function addButton() {
    const existingButton = document.getElementById(buttonId);
    existingButton?.remove();
    document.getElementById(styleId)?.remove();

    const button = document.createElement("button");
    button.id = buttonId;
    button.className = "bionify-control";
    button.type = "button";
    button.textContent = "B";
    button.title = "Bionify";
    button.lang = "en";
    button.translate = false;
    button.setAttribute("aria-label", "Bionify");
    button.setAttribute("translate", "no");

    let dragging = false;
    let moved = false;
    let startY = 0;
    let startTop = 0;

    button.addEventListener("pointerdown", (event) => {
      dragging = true;
      moved = false;
      startY = event.clientY;
      const rect = button.getBoundingClientRect();
      startTop = rect.top;
      button.setPointerCapture(event.pointerId);
    });

    button.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      event.preventDefault();
      const deltaY = event.clientY - startY;
      if (Math.abs(deltaY) > 3) moved = true;
      button.style.top = `${Math.max(0, Math.min(innerHeight - button.offsetHeight, startTop + deltaY))}px`;
    });

    button.addEventListener("pointerup", (event) => {
      dragging = false;
      button.releasePointerCapture?.(event.pointerId);
    });

    button.addEventListener("click", (event) => {
      if (moved) {
        event.preventDefault();
        moved = false;
        return;
      }
      sendToggleMessage();
      setTimeout(syncButtonState, 350);
    });

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      `#${buttonId} { position: fixed; left: auto !important; right: 10px !important; top: 50%; transform: translateY(-50%); z-index: 2147483647; width: 34px; height: 34px; padding: 0; border: 0; border-radius: 50%; background: #555; color: #fff; font: 700 17px sans-serif; line-height: 34px; text-align: center; cursor: grab; touch-action: none; user-select: none; box-shadow: 0 2px 8px rgba(0,0,0,.28); opacity: .88; } #${buttonId}.bionify-on { background: #188038; } #${buttonId}:hover { opacity: 1; }`;

    (document.head || document.documentElement).appendChild(style);
    (document.body || document.documentElement).appendChild(button);
  }

  if (!hasChromeStorage()) {
    addButton();
    syncButtonState();
    observeRenderState();
    return;
  }

  chrome.storage.sync.get(["floatingButtonEnabled"], (data) => {
    if (data.floatingButtonEnabled !== false) {
      addButton();
      syncButtonState();
      observeRenderState();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.floatingButtonEnabled) {
      if (changes.floatingButtonEnabled.newValue === false) removeButton();
      else {
        addButton();
        updateButtonState(document.getElementById("bionify-style-id") !== null);
        observeRenderState();
      }
    }
  });
})();
