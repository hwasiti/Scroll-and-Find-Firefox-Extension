let isSearching = false;

document.addEventListener('DOMContentLoaded', () => {
  const searchText = document.getElementById('searchText');
  const toggleButton = document.getElementById('toggleSearch');
  const maxScrollsInput = document.getElementById('maxScrolls');
  const statusDiv = document.getElementById('status');

  // Load saved max scrolls value
  chrome.storage.local.get('maxScrolls', (result) => {
    if (result.maxScrolls) {
      maxScrollsInput.value = result.maxScrolls;
    }
  });

  // Save max scrolls value when changed
  maxScrollsInput.addEventListener('change', () => {
    chrome.storage.local.set({ maxScrolls: maxScrollsInput.value });
  });

  function updateUI(searching) {
    isSearching = searching;
    toggleButton.textContent = isSearching ? 'Stop Search' : 'Start Search';
    statusDiv.textContent = isSearching ? 'Searching...' : 'Ready to search';
  }

  function toggleSearch() {
    isSearching = !isSearching;
    updateUI(isSearching);
    
    if (isSearching) {
      startSearch();
    } else {
      stopSearch();
    }
  }

  function startSearch() {
    const searchTerm = searchText.value;
    const maxScrolls = parseInt(maxScrollsInput.value);
    statusDiv.textContent = 'Initializing search...';
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "startSearch",
        searchText: searchTerm,
        maxScrolls: maxScrolls
      }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          updateUI(false);
        } else if (response && response.message) {
          statusDiv.textContent = response.message;
          if (response.message === "Search already in progress") {
            updateUI(true);
          }
        }
      });
    });
  }

  function stopSearch() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopSearch" }, (response) => {
        if (response && response.message) {
          statusDiv.textContent = response.message;
        }
      });
    });
  }

  toggleButton.addEventListener('click', toggleSearch);

  // Add enter key functionality
  searchText.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' && !isSearching) {
      toggleSearch();
    }
  });

  // Check initial search state
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getSearchState" }, (response) => {
      if (response && response.isSearching !== undefined) {
        updateUI(response.isSearching);
      }
    });
  });
});