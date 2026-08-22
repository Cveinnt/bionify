import {
  bionify,
  defaultHighlightSheet,
  defaultRestSheet,
  defaultHighlightColor,
  defaultAlgorithm,
  defaultChineseAlgorithm,
  defaultFloatingButtonEnabled,
} from "../utils.js";

let applyButton = document.getElementById("applyButton");
let autoButton = document.getElementById("autoButton");
let excludePatternInput = document.getElementById("excludePattern");
let excludePageButton = document.getElementById("excludePageButton");
let restoreButton = document.getElementById("restore-button");
let highlightSheetInput = document.getElementById("highlight-input");
let highlightColorEnabledInput = document.getElementById("highlight-color-enabled");
let highlightColorInput = document.getElementById("highlight-color-input");
let restSheetInput = document.getElementById("rest-input");
let algorithmInput = document.getElementById("algorithmInput");
let chineseSettingsInput = document.getElementById("chinese-settings-input");
let floatingButtonEnabledInput = document.getElementById("floating-button-enabled");
let snapshotNameInput = document.getElementById("snapshot-name-input");
let saveSnapshotButton = document.getElementById("save-snapshot-button");
let applySnapshotButton = document.getElementById("apply-snapshot-button");
let deleteSnapshotButton = document.getElementById("delete-snapshot-button");
let snapshotSelect = document.getElementById("snapshot-select");

var buttonEnabledClass = "button-enabled";
var buttonDisabledClass = "button-disabled";

function setClass(element, cls) {
  element.className = cls;
}

function getModeValues() {
  return {
    highlightSheet: highlightSheetInput.value,
    restSheet: restSheetInput.value,
    highlightColor: highlightColorInput.value,
    highlightColorEnabled: highlightColorEnabledInput.checked,
    algorithm: algorithmInput.value,
    chineseAlgorithm: chineseSettingsInput.value,
  };
}

function renderSnapshots(snapshots) {
  snapshotSelect.replaceChildren(new Option("Select a snapshot", ""));
  for (let snapshot of snapshots) {
    snapshotSelect.appendChild(new Option(snapshot.name, snapshot.name));
  }
}

function loadSnapshots() {
  chrome.storage.sync.get(["snapshots"], (data) => {
    renderSnapshots(data.snapshots || []);
  });
}

function saveSnapshot() {
  let name = snapshotNameInput.value.trim();
  if (!name) return;
  let values = getModeValues();
  chrome.storage.sync.get(["snapshots"], (data) => {
    let snapshots = data.snapshots || [];
    snapshots = snapshots.filter((snapshot) => snapshot.name !== name);
    snapshots.push({ name, values });
    chrome.storage.sync.set({ snapshots }, loadSnapshots);
    snapshotNameInput.value = name;
    snapshotSelect.value = name;
  });
}

function restoreSnapshot() {
  let name = snapshotSelect.value;
  if (!name) return;
  chrome.storage.sync.get(["snapshots"], (data) => {
    let snapshot = (data.snapshots || []).find((item) => item.name === name);
    if (!snapshot) return;
    let values = snapshot.values;
    snapshotNameInput.value = snapshot.name;
    highlightSheetInput.value = values.highlightSheet;
    restSheetInput.value = values.restSheet;
    highlightColorInput.value = values.highlightColor || defaultHighlightColor;
    highlightColorEnabledInput.checked = Boolean(values.highlightColorEnabled);
    algorithmInput.value = values.algorithm;
    chineseSettingsInput.value = values.chineseAlgorithm;
    saveAndRefresh(values);
  });
}

function deleteSnapshot() {
  let name = snapshotSelect.value;
  if (!name) return;
  chrome.storage.sync.get(["snapshots"], (data) => {
    let snapshots = (data.snapshots || []).filter((item) => item.name !== name);
    chrome.storage.sync.set({ snapshots }, loadSnapshots);
  });
}

async function refreshRenderedPage() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.bionifyForceRefresh = true;
      },
    })
    .then(() =>
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: bionify,
      })
    )
    .catch(() => {});
}

let refreshTimer;
async function saveAndRefresh(values) {
  await chrome.storage.sync.set(values);
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refreshRenderedPage(), 120);
}

async function updatePatternText() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  excludePatternInput.value = tab?.url || "";
  updateExcludeButtonText();
}

function updateExcludeButtonText() {
  var currentPattern = excludePatternInput.value;
  chrome.storage.sync.get(["excludedPatterns"], (data) => {
    let patterns = data.excludedPatterns || [];
    if (patterns.indexOf(currentPattern) != -1) {
      excludePageButton.innerText = "Remove Pattern";
      setClass(excludePageButton, buttonDisabledClass);
    } else {
      excludePageButton.innerText = "Add Pattern";
      setClass(excludePageButton, buttonEnabledClass);
    }
  });
}

updatePatternText();
loadSnapshots();

function toggleExcludedPattern(pattern) {
  chrome.storage.sync.get(["excludedPatterns"], (data) => {
    var patterns = data.excludedPatterns || [];

    var index = -1;
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i] === pattern) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      patterns.push(pattern);
    } else {
      patterns.splice(index, 1);
    }
    chrome.storage.sync.set({ excludedPatterns: patterns });
    updateExcludeButtonText();
  });
}

excludePageButton.addEventListener("click", async () => {
  toggleExcludedPattern(excludePatternInput.value);
});
function updateAutoApplyText(isAuto) {
  if (isAuto) {
    autoButton.innerText = "Disable Auto Apply";
    setClass(autoButton, buttonDisabledClass);
  } else {
    autoButton.innerText = "Enable Auto Apply";
    setClass(autoButton, buttonEnabledClass);
  }
}

chrome.storage.sync.get(
  [
    "highlightSheet",
    "restSheet",
    "highlightColor",
    "highlightColorEnabled",
    "autoApply",
    "isOn",
    "algorithm",
    "chineseAlgorithm",
    "floatingButtonEnabled",
  ],
  (data) => {
    highlightSheetInput.value = data.highlightSheet;
    highlightColorInput.value = data.highlightColor || defaultHighlightColor;
    highlightColorEnabledInput.checked = Boolean(data.highlightColorEnabled);
    restSheetInput.value = data.restSheet;
    algorithmInput.value = data.algorithm;
    chineseSettingsInput.value = data.chineseAlgorithm || defaultChineseAlgorithm;
    floatingButtonEnabledInput.checked =
      data.floatingButtonEnabled ?? defaultFloatingButtonEnabled;
    updateAutoApplyText(data.autoApply);
    // updatebionifyToggle(data.isOn);
  }
);

highlightSheetInput.addEventListener("input", async (text) => {
  saveAndRefresh({ highlightSheet: highlightSheetInput.value });
});
highlightColorEnabledInput.addEventListener("change", () => {
  saveAndRefresh({
    highlightColorEnabled: highlightColorEnabledInput.checked,
  });
});

highlightColorInput.addEventListener("input", () => {
  saveAndRefresh({ highlightColor: highlightColorInput.value });
});

restSheetInput.addEventListener("input", async (text) => {
  saveAndRefresh({ restSheet: restSheetInput.value });
});

algorithmInput.addEventListener("input", async (text) => {
  saveAndRefresh({ algorithm: algorithmInput.value });
});

chineseSettingsInput.addEventListener("input", () => {
  saveAndRefresh({ chineseAlgorithm: chineseSettingsInput.value });
});

saveSnapshotButton.addEventListener("click", saveSnapshot);
applySnapshotButton.addEventListener("click", restoreSnapshot);
deleteSnapshotButton.addEventListener("click", deleteSnapshot);
snapshotSelect.addEventListener("change", restoreSnapshot);

floatingButtonEnabledInput.addEventListener("change", () => {
  chrome.storage.sync.set({
    floatingButtonEnabled: floatingButtonEnabledInput.checked,
  });
});

excludePatternInput.addEventListener("input", async (text) => {
  updateExcludeButtonText();
});

restoreButton.addEventListener("click", async () => {
  let defaults = {
    highlightSheet: defaultHighlightSheet,
    restSheet: defaultRestSheet,
    highlightColor: defaultHighlightColor,
    highlightColorEnabled: true,
    algorithm: defaultAlgorithm,
    chineseAlgorithm: defaultChineseAlgorithm,
    floatingButtonEnabled: defaultFloatingButtonEnabled,
  };
  await chrome.storage.sync.set(defaults);
  highlightSheetInput.value = defaultHighlightSheet;
  highlightColorInput.value = defaultHighlightColor;
  highlightColorEnabledInput.checked = true;
  restSheetInput.value = defaultRestSheet;
  algorithmInput.value = defaultAlgorithm;
  chineseSettingsInput.value = defaultChineseAlgorithm;
  floatingButtonEnabledInput.checked = defaultFloatingButtonEnabled;
  refreshRenderedPage();
});

function updatebionifyToggle(isOn) {
  if (isOn) {
    applyButton.innerText = "Bionify: On";
    setClass(applyButton, buttonEnabledClass);
  } else {
    applyButton.innerText = "Bionify: Off";
    setClass(applyButton, buttonDisabledClass);
  }
}

applyButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      function: bionify,
    })
    .catch((error) => {
      console.warn("Bionify could not apply to this page:", error.message);
    });
  chrome.storage.sync.get(["isOn"], (data) => {
    // updatebionifyToggle(!data.isOn);
    chrome.storage.sync.set({ isOn: !data.isOn });
  });
});

autoButton.addEventListener("click", async () => {
  chrome.storage.sync.get(["autoApply"], (data) => {
    updateAutoApplyText(!data.autoApply);
    chrome.storage.sync.set({ autoApply: !data.autoApply });
  });
});
