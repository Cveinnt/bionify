export let defaultHighlightSheet = "font-weight: 600;";
export let defaultRestSheet = "opacity: 0.9;";
export let defaultAlgorithm = "- 0 1 1 2 0.4";

export function bionicifyPage() {
  function parseAlgorithm(algorithm) {
    try {
      var res = {
        exclude: true,
        sizes: [],
        restRatio: 0.4,
      };
      let parts = algorithm.split(" ");

      if (parts[0] == "+") {
        res.exclude = false;
      }

      res.restRatio = Number(parts[parts.length - 1]);

      for (var i = 1; i < parts.length - 1; i++) {
        res.sizes.push(parts[i]);
      }
      return res;
    } catch {
      var defaultRes = {
        exclude: true,
        sizes: [1, 1, 2],
        restRatio: 0.4,
      };
      console.log("not parsed");
      console.log(defaultRes);
      return defaultRes;
    }
  }

  chrome.storage.sync.get(["algorithm"], (data) => {
    var algorithm = parseAlgorithm(data.algorithm);

    function createStylesheet() {
      chrome.storage.sync.get(["highlightSheet", "restSheet"], function (data) {
        var style = document.createElement("style");
        style.type = "text/css";
        style.id = "bionic-style-id";
        style.innerHTML =
          ".bionic-highlight {" +
          data.highlightSheet +
          " } .bionic-rest {" +
          data.restSheet +
          "}";
        document.getElementsByTagName("head")[0].appendChild(style);
      });
    }

    function deleteStyleSheet() {
      var sheet = document.getElementById("bionic-style-id");
      sheet.remove();
    }

    function hasStyleSheet() {
      return document.getElementById("bionic-style-id") != null;
    }

    let commonWords = [
      "the",
      "be",
      "to",
      "of",
      "and",
      "a",
      "an",
      "it",
      "at",
      "on",
      "he",
      "she",
      "but",
      "is",
      "my",
    ];

    function bionicifyWord(word) {
      function isCommon(word) {
        return commonWords.indexOf(word) != -1;
      }

      var index = word.length - 1;

      var numBold = 1;

      if (word.length <= 3 && algorithm.exclude) {
        if (isCommon(word)) return word;
      }

      if (index < algorithm.sizes.length) {
        numBold = algorithm.sizes[index];
      } else {
        numBold = Math.ceil(word.length * algorithm.restRatio);
      }

      return (
        '<bionic class="bionic-highlight">' +
        word.slice(0, numBold) +
        "</bionic>" +
        '<bionic class="bionic-rest">' +
        word.slice(numBold) +
        "</bionic>"
      );
    }

    function bionicifyText(text) {
      var res = "";
      if (text.length < 10) {
        return text;
      }
      for (var word of text.split(" ")) {
        res += bionicifyWord(word) + " ";
      }
      return res;
    }

    function escapeHTML(unsafe_str) {
      return unsafe_str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/\'/g, "&#39;")
        .replace(/\//g, "&#x2F;");
    }

    function bionicifyNode(node) {
      if (
        node.tagName === "SCRIPT" ||
        node.tagName === "STYLE" ||
        node.nodeType === 8
      )
        return;
      if (node.childNodes == undefined || node.childNodes.length == 0) {
        if (node.textContent != undefined && node.tagName == undefined) {
          var newNode = document.createElement("bionic");
          newNode.innerHTML = bionicifyText(escapeHTML(node.textContent));
          if (node.textContent.length > 20) {
            node.replaceWith(newNode);
          }
        }
      } else {
        for (var child of node.childNodes) {
          bionicifyNode(child);
        }
      }
    }

    if (hasStyleSheet()) {
      deleteStyleSheet();
    } else {
      createStylesheet();
      bionicifyNode(document.body);
    }
  });
}

export function patternsInclude(patterns, url) {
  for (var pattern of patterns) {
    if (url.match(pattern)) {
      return true;
    }
  }
  return false;
}
