console.log("Scroll and Find content script loaded");

let isSearching = false;
let scrollCount = 0;
let lastScrollPosition = 0;
let samePositionCount = 0;
let searchText = '';
let maxScrolls = 10000;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "startSearch") {
    if (isSearching) {
      sendResponse({message: "Search already in progress"});
      return;
    }
    searchText = request.searchText;
    maxScrolls = request.maxScrolls;
    scrollCount = 0;
    lastScrollPosition = 0;
    samePositionCount = 0;
    isSearching = true;
    searchAndScroll(sendResponse);
    return true; // Indicates that we will send a response asynchronously
  } else if (request.action === "stopSearch") {
    isSearching = false;
    sendResponse({message: "Search stopped"});
  } else if (request.action === "getSearchState") {
    sendResponse({isSearching: isSearching});
  }
});

function highlightText(text) {
  if (window.find && window.getSelection) {
    document.designMode = "on";
    var sel = window.getSelection();
    sel.collapse(document.body, 0);
    
    while (window.find(text)) {
      document.execCommand("HiliteColor", false, "yellow");
      sel.collapseToEnd();
    }
    document.designMode = "off";
  }
}

function searchAndScroll(sendResponse) {
  function doScroll() {
    if (!isSearching) {
      sendResponse({message: "Search stopped"});
      return;
    }

    scrollCount++;
    console.log(`Scroll attempt ${scrollCount}`);

    // Get current scroll position before scrolling
    const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
    console.log(`Current position before scroll: ${currentPosition}`);

    // Perform the scroll
    window.scrollBy(0, window.innerHeight);

    // Get new scroll position after scrolling
    const newPosition = window.pageYOffset || document.documentElement.scrollTop;
    console.log(`New position after scroll: ${newPosition}`);

    // Check if the scroll position has changed
    if (newPosition === lastScrollPosition) {
      samePositionCount++;
      console.log(`Scroll position unchanged. Count: ${samePositionCount}`);
    } else {
      samePositionCount = 0;
    }
    lastScrollPosition = newPosition;

    // Attempt to find the text
    if (window.find(searchText)) {
      console.log("Text found!");
      highlightText(searchText);
      isSearching = false;
      sendResponse({message: "Text found and highlighted!"});
      return;
    }

    // Check if we've reached the max scroll limit
    if (scrollCount >= maxScrolls) {
      console.log("Reached max scroll limit without finding the text.");
      isSearching = false;
      sendResponse({message: "Reached max scroll limit without finding the text."});
      return;
    }

    // If position hasn't changed for a while, wait longer for possible content load
    if (samePositionCount >= 5) {
      console.log("Waiting for possible content load...");
      setTimeout(doScroll, 2000); // Wait 2 seconds
    } else {
      setTimeout(doScroll, 500); // Normal scroll every 500ms
    }
  }

  doScroll();
}