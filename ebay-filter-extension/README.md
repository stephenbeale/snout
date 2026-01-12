# eBay UK Price Research Filters

A Chrome extension that adds quick toggle filters for eBay UK price research. Easily switch between sold items, new condition, UK-only sellers, and Buy It Now listings.

## Features

- **Sold Items** - Toggle `LH_Sold=1` to view completed/sold listings
- **Condition: New** - Toggle `LH_ItemCondition=4` to filter for new items only
- **UK Only** - Toggle `LH_PrefLoc=1` to show only UK sellers
- **Buy It Now** - Toggle `LH_BIN=1` to show only fixed-price listings

The extension:
- Only activates on ebay.co.uk (greyed out on other sites)
- Reflects current URL state (toggles show ON if filter already applied)
- Includes a "Clear All Filters" button

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `ebay-filter-extension` folder
6. The extension icon will appear in your toolbar

## Usage

1. Navigate to any search results page on ebay.co.uk
2. Click the extension icon in your toolbar
3. Toggle the filters you want to apply
4. The page will reload with the selected filters applied

### Example URL with all filters:
```
https://www.ebay.co.uk/sch/i.html?_nkw=doctor+who+steel+book+series+5&_sacat=0&_from=R40&LH_ItemCondition=4&LH_PrefLoc=1&LH_Sold=1&rt=nc&LH_BIN=1
```

## Icons

The extension requires icon files in the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

See `icons/README.md` for icon creation guidelines.

## File Structure

```
ebay-filter-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker for icon state management
├── popup/
│   ├── popup.html         # Popup UI structure
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic and URL manipulation
├── icons/
│   └── README.md          # Icon requirements
└── README.md              # This file
```

## Technical Details

- **Manifest Version**: 3 (current Chrome standard)
- **Permissions**:
  - `activeTab` - Access to the current tab
  - `tabs` - Query and update tab URLs
- **Host Permissions**: `https://www.ebay.co.uk/*`

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Troubleshooting

**Extension icon is greyed out:**
- Make sure you're on ebay.co.uk (not ebay.com or other eBay sites)

**Toggles don't reflect current URL state:**
- Close and reopen the popup to refresh the state

**Page doesn't reload:**
- Check the browser console for errors (F12 > Console)
- Ensure the extension has the required permissions

## License

MIT License - Feel free to modify and distribute.
