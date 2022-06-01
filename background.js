import {
  bionify,
  patternsInclude,
  defaultHighlightSheet,
  defaultRestSheet,
  defaultAlgorithm,
} from "./utils.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    highlightSheet: defaultHighlightSheet,
    restSheet: defaultRestSheet,
    autoApply: false,
    excludedPatterns: [],
    algorithm: defaultAlgorithm,
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status == "complete") {
    chrome.storage.sync.get(["autoApply", "excludedPatterns"], async (data) => {
      if (data.autoApply) {
        let tab = await chrome.tabs.get(tabId);
        if (!patternsInclude(data.excludedPatterns, tab.url)) {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: bionify,
          });
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

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: bionify,
    });
  }
});
