// eBay UK Price Research Filters - Popup Script

// Filter parameter configuration
const FILTERS = [
  { id: 'toggle-sold', param: 'LH_Sold', value: '1' },
  { id: 'toggle-new', param: 'LH_ItemCondition', value: '4' },
  { id: 'toggle-uk', param: 'LH_PrefLoc', value: '1' },
  { id: 'toggle-bin', param: 'LH_BIN', value: '1' }
];

// Check if URL is on eBay UK
function isEbayUK(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('ebay.co.uk');
  } catch {
    return false;
  }
}

// Parse current URL and check if a filter parameter is active
function isFilterActive(url, param, value) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(param) === value;
  } catch {
    return false;
  }
}

// Add or remove a filter parameter from the URL
function toggleFilterInUrl(url, param, value, enable) {
  try {
    const urlObj = new URL(url);

    if (enable) {
      urlObj.searchParams.set(param, value);
    } else {
      urlObj.searchParams.delete(param);
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

// Remove all filter parameters from the URL
function clearAllFilters(url) {
  try {
    const urlObj = new URL(url);

    for (const filter of FILTERS) {
      urlObj.searchParams.delete(filter.param);
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

// Update the page URL and reload
async function updatePageUrl(newUrl) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      await chrome.tabs.update(tab.id, { url: newUrl });
    }
  } catch (error) {
    console.error('Error updating tab URL:', error);
  }
}

// Initialize the popup state based on current URL
async function initializePopup() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      showNotEbayMessage();
      return;
    }

    const currentUrl = tab.url;

    // Check if we're on eBay UK
    if (!isEbayUK(currentUrl)) {
      showNotEbayMessage();
      return;
    }

    // Show filters and hide message
    showFilters();

    // Set toggle states based on current URL
    for (const filter of FILTERS) {
      const checkbox = document.getElementById(filter.id);
      if (checkbox) {
        checkbox.checked = isFilterActive(currentUrl, filter.param, filter.value);
      }
    }

    // Add event listeners to toggles
    for (const filter of FILTERS) {
      const checkbox = document.getElementById(filter.id);
      if (checkbox) {
        checkbox.addEventListener('change', async (event) => {
          const isEnabled = event.target.checked;
          const row = checkbox.closest('.filter-row');

          // Add loading state
          row.classList.add('loading');

          // Get fresh URL (in case it changed)
          const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (currentTab && currentTab.url) {
            const newUrl = toggleFilterInUrl(currentTab.url, filter.param, filter.value, isEnabled);
            await updatePageUrl(newUrl);
          }

          // Remove loading state (popup will close anyway on navigation)
          row.classList.remove('loading');
        });
      }
    }

    // Add clear all button handler
    const clearButton = document.getElementById('clear-all');
    if (clearButton) {
      clearButton.addEventListener('click', async () => {
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTab && currentTab.url) {
          const newUrl = clearAllFilters(currentTab.url);
          await updatePageUrl(newUrl);
        }
      });
    }

  } catch (error) {
    console.error('Error initializing popup:', error);
    showNotEbayMessage();
  }
}

// Show the "not on eBay" message
function showNotEbayMessage() {
  const message = document.getElementById('not-ebay-message');
  const filters = document.getElementById('filters-container');
  const footer = document.querySelector('.footer');

  if (message) message.classList.remove('hidden');
  if (filters) filters.classList.add('hidden');
  if (footer) footer.classList.add('hidden');
}

// Show the filters (hide message)
function showFilters() {
  const message = document.getElementById('not-ebay-message');
  const filters = document.getElementById('filters-container');
  const footer = document.querySelector('.footer');

  if (message) message.classList.add('hidden');
  if (filters) filters.classList.remove('hidden');
  if (footer) footer.classList.remove('hidden');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);
