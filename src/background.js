import {
  bionify,
  patternsInclude,
  defaultHighlightSheet,
  defaultRestSheet,
  defaultHighlightColor,
  defaultAlgorithm,
  defaultChineseGap,
  defaultChineseHighlight,
  defaultChineseAlgorithm,
  defaultChineseGapOpacity,
  defaultChineseHighlightIntensity,
  defaultFloatingButtonEnabled,
} from "./utils.js";

chrome.runtime.onInstalled.addListener(() => {
  let defaults = {
    highlightSheet: defaultHighlightSheet,
    restSheet: defaultRestSheet,
    highlightColor: defaultHighlightColor,
    highlightColorEnabled: true,
    autoApply: false,
    excludedPatterns: [],
    algorithm: defaultAlgorithm,
    chineseGap: defaultChineseGap,
    chineseHighlight: defaultChineseHighlight,
    chineseAlgorithm: defaultChineseAlgorithm,
    chineseGapOpacity: defaultChineseGapOpacity,
    chineseHighlightIntensity: defaultChineseHighlightIntensity,
    floatingButtonEnabled: defaultFloatingButtonEnabled,
    isOn: false,
  };

  chrome.storage.sync.get(Object.keys(defaults), (data) => {
    let missing = {};
    for (let key of Object.keys(defaults)) {
      if (data[key] === undefined) missing[key] = defaults[key];
    }
    if (Object.keys(missing).length > 0) chrome.storage.sync.set(missing);
  });
});

function canInject(url) {
  return /^https?:\/\//.test(url) || /^file:\/\//.test(url);
}

async function applyToTab(tabId) {
  try {
    let tab = await chrome.tabs.get(tabId);
    if (!tab.url || !canInject(tab.url)) return;

    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: bionify,
    });
    return true;
  } catch (error) {
    console.warn("Bionify could not apply to this page:", error.message);
    return false;
  }
}

async function ensureFloatingButton(tabId) {
  try {
    let tab = await chrome.tabs.get(tabId);
    if (!tab.url || !canInject(tab.url)) return;
    let settings = await chrome.storage.sync.get(["floatingButtonEnabled"]);
    if (settings.floatingButtonEnabled === false) return;

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/floating-button.js"],
    });
  } catch (error) {
    console.warn("Bionify could not add the floating button:", error.message);
  }
}

async function refreshRenderedTab(tabId) {
  try {
    let tab = await chrome.tabs.get(tabId);
    if (!tab.url || !canInject(tab.url)) return;

    let [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.getElementById("bionify-style-id") !== null,
    });
    if (!result?.result) return;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        window.bionifyForceRefresh = true;
      },
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      function: bionify,
    });
  } catch (error) {
    console.warn("Bionify could not refresh this page:", error.message);
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  let renderSettings = [
    "algorithm",
    "highlightSheet",
    "restSheet",
    "highlightColor",
    "highlightColorEnabled",
    "chineseAlgorithm",
  ];
  if (!renderSettings.some((key) => changes[key])) return;

  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      if (tab.id) refreshRenderedTab(tab.id);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status == "complete") {
    ensureFloatingButton(tabId);
    chrome.storage.sync.get(["autoApply", "excludedPatterns"], async (data) => {
      if (data.autoApply) {
        let tab = await chrome.tabs.get(tabId).catch(() => null);
        if (tab?.url && !patternsInclude(data.excludedPatterns || [], tab.url)) {
          await applyToTab(tabId);
        }
      }
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-auto-bionify") {
    chrome.storage.sync.get(["autoApply"], (data) => {
      chrome.storage.sync.set({ autoApply: !data.autoApply });
    });
  }
  if (command === "toggle-bionify") {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await applyToTab(tab.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "toggle-bionify" && sender.tab?.id) {
    chrome.storage.sync.get(["isOn"], async (data) => {
      if (await applyToTab(sender.tab.id)) {
        await chrome.storage.sync.set({ isOn: !data.isOn });
      }
    });
  }
});
