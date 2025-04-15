/**
 * Background script for LinkedIn Sales Navigator Scraper
 * Handles background tasks like downloading files
 */

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadCSV') {
    downloadCSV(request.data.url, request.data.filename);
    return true;
  }
});

/**
 * Downloads a file using the chrome.downloads API
 * @param {string} url URL of the file to download
 * @param {string} filename Suggested filename for the download
 */
function downloadCSV(url, filename) {
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
} 