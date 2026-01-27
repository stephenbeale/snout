// Background service worker for eBay UK Price Research extension
// Handles enabling/disabling the extension icon based on the current tab URL

// Update the extension icon state based on whether we're on eBay UK
function updateIconState(tabId, url) {
  if (url && url.includes('ebay.co.uk')) {
    // Enable the action (clickable) on eBay UK
    chrome.action.enable(tabId);
  } else {
    // Disable the action (greyed out) on other sites
    chrome.action.disable(tabId);
  }
}

// Listen for tab updates (URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateIconState(tabId, tab.url);
  }
});

// Listen for tab activation (switching tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateIconState(activeInfo.tabId, tab.url);
  } catch (error) {
    console.error('Error getting tab info:', error);
  }
});

// Initialize state for all existing tabs when extension loads
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      updateIconState(tab.id, tab.url);
    }
  } catch (error) {
    console.error('Error initializing tabs:', error);
  }
});

// Also initialize on service worker startup
chrome.tabs.query({}).then(tabs => {
  for (const tab of tabs) {
    updateIconState(tab.id, tab.url);
  }
}).catch(error => {
  console.error('Error initializing on startup:', error);
});
