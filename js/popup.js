/**
 * Popup script for LinkedIn Scraper
 * Handles UI interaction and communicates with content and background scripts
 */

// DOM elements
const scrapeButton = document.getElementById('scrapeButton');
const scrapeAllButton = document.getElementById('scrapeAllButton');
const downloadButton = document.getElementById('downloadButton');
const statusMessage = document.getElementById('statusMessage');
const progressBar = document.getElementById('progressFill');
const resultsCount = document.getElementById('resultsCount');

// Global variables
let scrapedData = [];
let isScrapingAll = false;
let currentPage = 1;
let totalPages = 1;
let isRegularLinkedIn = false;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a LinkedIn search page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    // Check if we're on a regular LinkedIn search page
    if (currentTab.url.includes('linkedin.com/search/results')) {
      isRegularLinkedIn = true;
      statusMessage.textContent = 'Ready to scrape LinkedIn search results.';
    } 
    // Check if we're on a Sales Navigator page
    else if (currentTab.url.includes('linkedin.com/sales/search')) {
      isRegularLinkedIn = false;
      statusMessage.textContent = 'Ready to scrape Sales Navigator results.';
    } 
    // Not on a supported LinkedIn page
    else {
      disableButtons();
      statusMessage.textContent = 'Please navigate to a LinkedIn search page.';
      return;
    }
    
    // Load any previously scraped data
    chrome.storage.local.get('scrapedData', (result) => {
      if (result.scrapedData && result.scrapedData.length > 0) {
        scrapedData = result.scrapedData;
        updateResultsCount();
        downloadButton.disabled = false;
      }
    });
  });
});

// Event listeners
scrapeButton.addEventListener('click', () => {
  scrapedData = []; // Reset data when starting a new scrape
  downloadButton.disabled = true; // Disable download button until scraping completes
  scrapeSinglePage();
});

scrapeAllButton.addEventListener('click', () => {
  scrapedData = []; // Reset data when starting a new scrape
  downloadButton.disabled = true; // Disable download button until scraping completes
  startMultiPageScrape();
});

downloadButton.addEventListener('click', () => {
  if (scrapedData.length > 0) {
    exportToCSV();
  }
});

/**
 * Scrapes a single page of search results
 */
function scrapeSinglePage() {
  statusMessage.textContent = 'Scraping page...';
  scrapeButton.disabled = true; // Disable the scrape button during scraping
  
  // Start with progress bar at 0%
  updateProgressBar(0);
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Make sure the content script is loaded
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['js/content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error injecting content script:', chrome.runtime.lastError);
        statusMessage.textContent = 'Error injecting content script. Please refresh the page.';
        scrapeButton.disabled = false;
        return;
      }
      
      // Show scraping status with page type
      statusMessage.textContent = `Scraping ${isRegularLinkedIn ? 'regular LinkedIn' : 'Sales Navigator'} page...`;
      
      // Update progress to 20% after content script is loaded
      updateProgressBar(20);
      
      // Now send the message to the content script with the search type
      chrome.tabs.sendMessage(
        tabs[0].id,
        { 
          action: 'scrapePage',
          isRegularLinkedIn: isRegularLinkedIn 
        },
        (response) => {
          scrapeButton.disabled = false; // Re-enable the button
          
          if (chrome.runtime.lastError) {
            console.error('Error scraping page:', chrome.runtime.lastError);
            statusMessage.textContent = 'Error: ' + chrome.runtime.lastError.message;
            
            // Reset progress bar on error
            updateProgressBar(0);
            
            // Show debugging info
            showDebugInfo('Communication error with content script. Try refreshing the page.');
            return;
          }
          
          // Update progress to 80% when response is received
          updateProgressBar(80);
          
          if (response && response.success) {
            scrapedData = response.data;
            
            // Check data quality
            const dataQualityIssues = checkDataQuality(scrapedData);
            
            updateResultsCount();
            
            if (scrapedData.length > 0) {
              // Fill progress bar to 100% when scraping is successful
              updateProgressBar(100);
              statusMessage.textContent = 'Scraping completed!';
              downloadButton.disabled = false; // Enable download button
              
              // Show warnings about data quality if needed
              if (dataQualityIssues.length > 0) {
                showDebugInfo(`Scraping completed with some issues: ${dataQualityIssues.join(', ')}. You can still download the data.`);
              }
              
              // Save data to storage
              chrome.storage.local.set({ scrapedData });
            } else {
              // Fill progress bar to 100% even when no results are found
              updateProgressBar(100);
              statusMessage.textContent = 'No results found on this page.';
              
              // Provide more detailed debug info about why no results were found
              if (response.debug) {
                showDebugInfo(`The scraper ran but found no profiles. Debug info: ${response.debug}`);
              } else {
                showDebugInfo(`
                  <p>The scraper ran but didn't find any profiles. This might be due to:</p>
                  <ul>
                    <li>LinkedIn's page structure has changed</li>
                    <li>You might need to scroll down to load more profiles</li>
                    <li>The page might be showing a different view than expected</li>
                    <li>You might not be logged in to LinkedIn</li>
                  </ul>
                  <p>Try refreshing the page or scrolling down to load more profiles before scraping again.</p>
                `);
              }
            }
          } else {
            // Reset progress bar on error
            updateProgressBar(0);
            statusMessage.textContent = 'Failed to scrape page.';
            
            if (response && response.error) {
              showDebugInfo(`Error: ${response.error}`);
            } else {
              showDebugInfo('Unknown error occurred. Check the console for more details.');
            }
          }
        }
      );
    });
  });
}

/**
 * Checks data quality and returns a list of issues
 * @param {Array} data The scraped data to check
 * @returns {Array} List of quality issues found
 */
function checkDataQuality(data) {
  const issues = [];
  let missingTitles = 0;
  let missingCompanies = 0;
  let missingLocations = 0;
  
  data.forEach(item => {
    if (!item.title || item.title.trim() === '') missingTitles++;
    if (!item.company || item.company.trim() === '') missingCompanies++;
    if (!item.location || item.location.trim() === '') missingLocations++;
  });
  
  const total = data.length;
  if (total > 0) {
    if (missingTitles > 0) {
      const percent = Math.round((missingTitles / total) * 100);
      issues.push(`${percent}% of profiles are missing job titles`);
    }
    
    if (missingCompanies > 0) {
      const percent = Math.round((missingCompanies / total) * 100);
      issues.push(`${percent}% of profiles are missing companies`);
    }
    
    if (missingLocations > 0) {
      const percent = Math.round((missingLocations / total) * 100);
      issues.push(`${percent}% of profiles are missing locations`);
    }
  }
  
  return issues;
}

/**
 * Starts scraping all pages of search results
 */
function startMultiPageScrape() {
  isScrapingAll = true;
  statusMessage.textContent = 'Getting total pages...';
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Make sure the content script is loaded
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['js/content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error injecting content script:', chrome.runtime.lastError);
        statusMessage.textContent = 'Error injecting content script. Please refresh the page.';
        return;
      }
      
      chrome.tabs.sendMessage(
        tabs[0].id,
        { 
          action: 'getTotalPages',
          isRegularLinkedIn: isRegularLinkedIn 
        },
        (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            statusMessage.textContent = 'Error getting total pages.';
            isScrapingAll = false;
            
            if (chrome.runtime.lastError) {
              showDebugInfo('Communication error: ' + chrome.runtime.lastError.message);
            } else if (response && response.error) {
              showDebugInfo('Error: ' + response.error);
            }
            return;
          }
          
          totalPages = response.totalPages;
          currentPage = 1;
          
          statusMessage.textContent = `Scraping page 1 of ${totalPages}...`;
          updateProgressBar(0);
          
          // Disable buttons during scraping
          scrapeButton.disabled = true;
          scrapeAllButton.disabled = true;
          
          // Start scraping the first page
          scrapeCurrentPage();
        }
      );
    });
  });
}

/**
 * Scrapes the current page and continues to the next if needed
 */
function scrapeCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { 
        action: 'scrapePage',
        isRegularLinkedIn: isRegularLinkedIn 
      },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          finishMultiPageScrape('Error scraping page ' + currentPage);
          
          if (chrome.runtime.lastError) {
            showDebugInfo('Communication error: ' + chrome.runtime.lastError.message);
          } else if (response && response.error) {
            showDebugInfo('Error: ' + response.error);
          }
          return;
        }
        
        // Add the results to our data array
        scrapedData = [...scrapedData, ...response.data];
        updateResultsCount();
        
        // Save data to storage after each page
        chrome.storage.local.set({ scrapedData });
        
        // Update progress
        const progress = (currentPage / totalPages) * 100;
        updateProgressBar(progress);
        
        // Check if we need to continue to the next page
        if (currentPage < totalPages && isScrapingAll) {
          currentPage++;
          statusMessage.textContent = `Scraping page ${currentPage} of ${totalPages}...`;
          
          // Navigate to the next page
          chrome.tabs.sendMessage(
            tabs[0].id,
            { 
              action: 'navigateToPage', 
              pageNumber: currentPage,
              isRegularLinkedIn: isRegularLinkedIn 
            },
            () => {
              // Wait for the page to load before continuing
              setTimeout(() => {
                scrapeCurrentPage();
              }, 5000); // 5 second delay to allow page to load
            }
          );
        } else {
          finishMultiPageScrape('All pages scraped successfully!');
        }
      }
    );
  });
}

/**
 * Completes the multi-page scraping process
 * @param {string} message Status message to display
 */
function finishMultiPageScrape(message) {
  isScrapingAll = false;
  statusMessage.textContent = message;
  
  // Re-enable buttons
  scrapeButton.disabled = false;
  scrapeAllButton.disabled = false;
  
  if (scrapedData.length > 0) {
    downloadButton.disabled = false; // Make sure download button is enabled
  } else {
    showDebugInfo('No profiles were scraped. Try refreshing the page or check if you\'re logged in to LinkedIn.');
  }
}

/**
 * Updates the progress bar fill
 * @param {number} percentage Progress percentage (0-100)
 */
function updateProgressBar(percentage) {
  progressBar.style.width = `${percentage}%`;
}

/**
 * Updates the results count display
 */
function updateResultsCount() {
  resultsCount.textContent = `${scrapedData.length} leads found`;
  
  // Always enable download button if we have data
  if (scrapedData.length > 0) {
    downloadButton.disabled = false;
  }
}

/**
 * Disables all action buttons
 */
function disableButtons() {
  scrapeButton.disabled = true;
  scrapeAllButton.disabled = true;
  downloadButton.disabled = true;
}

/**
 * Shows debugging information
 * @param {string} debugText Debug information to display
 */
function showDebugInfo(debugText) {
  console.log('Debug info:', debugText);
  
  const debugElement = document.createElement('div');
  debugElement.className = 'debug-info';
  debugElement.innerHTML = `
    <details>
      <summary>Debug Info (click to expand)</summary>
      <div class="debug-content">${debugText}</div>
      <div class="debug-tip">
        <strong>Tip:</strong> Open the browser console (F12 > Console tab) for more detailed logs.
      </div>
    </details>
  `;
  
  // Remove any existing debug info
  const existingDebug = document.querySelector('.debug-info');
  if (existingDebug) {
    existingDebug.remove();
  }
  
  // Add the debug element after the status panel
  const statusPanel = document.querySelector('.status-panel');
  statusPanel.insertAdjacentElement('afterend', debugElement);
}

/**
 * Exports scraped data to CSV file
 */
function exportToCSV() {
  if (scrapedData.length === 0) return;
  
  // Log sample of data for debugging
  console.log('Data structure sample:', scrapedData.slice(0, 2));
  
  // Log data structure details
  if (scrapedData.length > 0) {
    const firstItem = scrapedData[0];
    console.log('First item properties:', Object.keys(firstItem));
    console.log('First item values:', firstItem);
  }
  
  // Define CSV headers - combining Title and Company into a single field
  const headers = ['Name', 'Title & Company', 'Location', 'Profile URL'];
  
  // Log full data for debugging purposes
  console.log('Data to export:', scrapedData);
  
  // Check for specific examples to diagnose
  const diagExample = scrapedData.find(item => 
    (item.name && item.name.includes("Fiorella")) || 
    (item.fullName && item.fullName.includes("Fiorella")) ||
    (item.company && item.company.includes("Intuit")) ||
    (item.companyName && item.companyName.includes("Intuit")) ||
    (item.title && item.title.includes("Marketing Manager"))
  );
  
  if (diagExample) {
    console.log('Found diagnostic example:', diagExample);
    const name = diagExample.name || diagExample.fullName || 'Unknown';
    const title = diagExample.title || 'N/A';
    const company = diagExample.company || diagExample.companyName || 'N/A';
    const location = diagExample.location || 'N/A';
    showDebugInfo(`Found diagnostic example: ${name}, Title: "${title}", Company: "${company}", Location: "${location}"`);
  }
  
  // Check for missing data - using proper field names and checking field existence
  const missingData = [];
  scrapedData.forEach(lead => {
    const name = lead.name || lead.fullName || 'Unknown';
    if (!lead.title && !lead.jobTitle) missingData.push(`${name} - missing title`);
    if (!lead.company && !lead.companyName) missingData.push(`${name} - missing company`);
  });
  
  if (missingData.length > 0) {
    console.log('Missing data in leads:', missingData);
    if (missingData.length <= 5) {
      showDebugInfo(`Data quality issues: ${missingData.join('; ')}`);
    } else {
      showDebugInfo(`Data quality issues found in ${missingData.length} records. Check console for details.`);
    }
  }
  
  let csvContent = headers.join(',') + '\n';
  
  scrapedData.forEach(lead => {
    // Ensure each field exists and has a value
    const name = lead.name || lead.fullName || '';
    const title = lead.title || '';
    const company = lead.company || lead.companyName || '';
    // Combine title and company
    const titleAndCompany = company ? (title ? `${title} at ${company}` : company) : title;
    const location = lead.location || '';
    const profileUrl = lead.profileUrl || '';
    
    const row = [
      escapeCsvField(name),
      escapeCsvField(titleAndCompany),
      escapeCsvField(location),
      escapeCsvField(profileUrl)
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Get current date and time for filename
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `linkedin_leads_${date}_${time}.csv`;
  
  // Send download request to background script
  chrome.runtime.sendMessage({
    action: 'downloadCSV',
    data: {
      url: url,
      filename: filename
    }
  });
  
  statusMessage.textContent = 'Downloading CSV file...';
  
  // Also write to console for debugging
  console.log('CSV Content Preview (first 500 chars):', csvContent.substring(0, 500));
}

/**
 * Escapes a field for CSV format
 * @param {string} field The field to escape
 * @returns {string} Escaped field
 */
function escapeCsvField(field) {
  if (field === null || field === undefined) return '';
  
  // Convert to string
  const str = String(field);
  
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // Double any existing quotes
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
} 