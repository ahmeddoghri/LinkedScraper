# LinkedIn Scraper

A Chrome extension that allows you to scrape both regular LinkedIn and LinkedIn Sales Navigator search results and export them to CSV.

## Features

- Scrape lead information from regular LinkedIn search pages
- Scrape lead information from LinkedIn Sales Navigator search pages
- Scrape a single page or all pages of search results
- Export data to CSV file
- Simple and easy-to-use interface

## Installation

### Option 1: Local Development Installation

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" button and select the directory containing this extension
5. The extension should now appear in your extensions list and be ready to use

### Option 2: Package the Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Pack extension" button
4. Browse to the directory containing this extension and click "Pack Extension"
5. Chrome will create a `.crx` file and a `.pem` key file
6. You can distribute the `.crx` file to users (keep the `.pem` file safe as it's needed for updating the extension)

## Usage

1. Log in to your LinkedIn account
2. Navigate to either:
   - A regular LinkedIn search results page (e.g., `https://www.linkedin.com/search/results/people/?keywords=...`)
   - A LinkedIn Sales Navigator search results page (e.g., `https://www.linkedin.com/sales/search/people?keywords=...`)
3. Click the extension icon in the toolbar to open the popup
4. Choose one of the following options:
   - "Scrape Current Page" to extract data from the current page only
   - "Scrape All Pages" to extract data from all pages of the search results
5. Wait for the scraping process to complete
6. Click "Download CSV" to save the data to a CSV file

## CSV Output Format

The exported CSV file includes the following columns:
- Name
- Title
- Company
- Location
- Industry
- Connection Degree
- Shared Connections
- Profile URL

## Supported LinkedIn Page Types

### Regular LinkedIn Search
The extension works with regular LinkedIn search pages that match this pattern:
- `https://www.linkedin.com/search/results/*`

### LinkedIn Sales Navigator
The extension works with Sales Navigator search pages that match this pattern:
- `https://www.linkedin.com/sales/*`

## Notes

- This extension is for personal use only
- Be aware of LinkedIn's terms of service regarding data scraping
- The extension requires access to LinkedIn's website to function properly
- Performance may vary depending on your internet connection and the complexity of the page

## Troubleshooting

If the extension isn't working as expected:
1. Make sure you're on a supported LinkedIn search page
2. Check that you're logged in to your LinkedIn account
3. Try refreshing the page and reopening the extension
4. If the page structure changes, the scraper might need to be updated

### Common Issues

#### Download Button Stays Disabled
If you've scraped data but the download button remains disabled:
1. Check the browser console for any error messages (Press F12, then click Console)
2. Try reloading the extension by going to `chrome://extensions/`, and clicking the refresh icon for this extension
3. Make sure you're using the latest version of Chrome

#### No Results Scraped
If the scraper runs but doesn't find any results:
1. LinkedIn may have updated their page structure. Open the console (F12) to see any error messages
2. The extension contains multiple selectors to try to adapt to LinkedIn's changes, but sometimes manual updates may be needed
3. Try running the scraper again after refreshing the page

#### Extension Not Working At All
If the extension doesn't work at all:
1. Make sure you have all the required permissions enabled for the extension
2. Check if any other extensions might be conflicting with this one
3. Try disabling and re-enabling the extension

## Debugging

For developers who want to debug or modify the extension:

1. Open Chrome DevTools while on the LinkedIn page
2. Go to the Console tab
3. Look for log messages beginning with "LinkedIn Scraper:"
4. Error messages will provide details about what's failing

You can also inspect the page elements to see if LinkedIn has changed their HTML structure, which may require updating the selectors in `content.js`. 