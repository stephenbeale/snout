// eBay UK Price Research Filters - Popup Script

// Filter parameter configuration
const FILTERS = [
  { id: 'toggle-sold', param: 'LH_Sold', value: '1', storageKey: 'filter_sold' },
  { id: 'toggle-new', param: 'LH_ItemCondition', value: '4', storageKey: 'filter_new' },
  { id: 'toggle-uk', param: 'LH_PrefLoc', value: '1', storageKey: 'filter_uk' },
  { id: 'toggle-bin', param: 'LH_BIN', value: '1', storageKey: 'filter_bin' }
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

// Check if URL is an eBay search page
function isSearchPage(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes('/sch/');
  } catch {
    return false;
  }
}

// Build URL with filters applied based on stored state
function applyFiltersToUrl(url, filterStates) {
  try {
    const urlObj = new URL(url);

    for (const filter of FILTERS) {
      const isEnabled = filterStates[filter.storageKey] === true;
      if (isEnabled) {
        urlObj.searchParams.set(filter.param, filter.value);
      } else {
        urlObj.searchParams.delete(filter.param);
      }
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

// Load filter states from storage
async function loadFilterStates() {
  const keys = FILTERS.map(f => f.storageKey);
  const result = await chrome.storage.sync.get(keys);
  return result;
}

// Save a single filter state to storage
async function saveFilterState(storageKey, enabled) {
  await chrome.storage.sync.set({ [storageKey]: enabled });
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

// Initialize the popup state based on stored settings
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

    // Load persisted filter states from storage
    const filterStates = await loadFilterStates();

    // Set toggle states based on stored settings (not URL)
    for (const filter of FILTERS) {
      const checkbox = document.getElementById(filter.id);
      if (checkbox) {
        checkbox.checked = filterStates[filter.storageKey] === true;
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

          // Save to persistent storage
          await saveFilterState(filter.storageKey, isEnabled);

          // Get fresh URL and filter states
          const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (currentTab && currentTab.url && isSearchPage(currentTab.url)) {
            // Load all current filter states and apply to URL
            const allFilterStates = await loadFilterStates();
            const newUrl = applyFiltersToUrl(currentTab.url, allFilterStates);
            await updatePageUrl(newUrl);
          }

          // Remove loading state
          row.classList.remove('loading');
        });
      }
    }

    // Add clear all button handler
    const clearButton = document.getElementById('clear-all');
    if (clearButton) {
      clearButton.addEventListener('click', async () => {
        // Clear all stored filter states
        for (const filter of FILTERS) {
          await saveFilterState(filter.storageKey, false);
          const checkbox = document.getElementById(filter.id);
          if (checkbox) {
            checkbox.checked = false;
          }
        }

        // Update URL if on search page
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTab && currentTab.url && isSearchPage(currentTab.url)) {
          const allFilterStates = await loadFilterStates();
          const newUrl = applyFiltersToUrl(currentTab.url, allFilterStates);
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
