const stockNameEl = document.getElementById("stock-name");
const companyNameEl = document.getElementById("company-name");
const tickerSymbolEl = document.getElementById("ticker-symbol");
const startDateEl = document.getElementById("start-date");
const endDateEl = document.getElementById("end-date");
const generateAnalysisBtn = document.getElementById("generate-analysis-btn");
const perplexityResultsEl = document.getElementById("perplexity-results");
const perplexityPlaceholderEl = document.getElementById("perplexity-placeholder");

// Load configuration
// Note: In a real Chrome extension, you'd typically use chrome.storage for sensitive data
const CONFIG = {
  PERPLEXITY_API_KEY: "YOUR_PERPLEXITY_API_KEY", // Set your API key here
  PERPLEXITY_API_URL: "https://api.perplexity.ai/chat/completions",
  DEFAULT_MODEL: "sonar",
  MAX_TOKENS: 1500,
  TEMPERATURE: 0.2
};

// Sample data for testing
const SAMPLE_COMPANY_DATA = {
  companyName: "Apple Inc.",
  ticker: "AAPL",
  startDate: "October 1, 2024",
  endDate: "October 31, 2024",
  sampleEvents: [
    {
      title: "Q4 Earnings Beat Expectations",
      date: "October 25, 2024",
      story: "Apple reported Q4 revenue of $89.5 billion, beating analyst estimates of $88.3 billion. The company saw strong iPhone 15 sales and record services revenue.",
      managementQuote: "CEO Tim Cook stated, 'We're proud of our strong performance this quarter, driven by robust iPhone demand and growing services ecosystem.'",
      stockImpact: "Stock rose 5.2% in after-hours trading following the earnings announcement. Analysts upgraded price targets citing strong fundamentals.",
      source: "https://investor.apple.com/news-releases/news-release-details/apple-reports-fourth-quarter-results"
    },
    {
      title: "China Market Concerns",
      date: "October 15, 2024", 
      story: "Reports emerged of declining iPhone sales in China, with local competitors gaining market share. Government restrictions on foreign tech companies increased.",
      managementQuote: "CFO Luca Maestri noted, 'We continue to see challenges in certain international markets, but remain confident in our long-term strategy.'",
      stockImpact: "Stock dropped 3.8% as investors worried about revenue exposure to China, which represents 20% of Apple's total sales.",
      source: "https://finance.yahoo.com/news/apple-faces-china-headwinds-iphone-sales-120000000.html"
    }
  ]
};

function updateStockName(name) {
  stockNameEl.textContent = name || "Not detected";
}

function showLoading() {
  perplexityPlaceholderEl.style.display = "none";
  perplexityResultsEl.innerHTML = '<div class="loading">Getting AI response...</div>';
}

function showError(message) {
  perplexityResultsEl.innerHTML = `<p style="color: #dc2626; margin: 0;">Error: ${message}</p>`;
}

function showResponse(response) {
  perplexityResultsEl.innerHTML = `<div class="perplexity-response">${response}</div>`;
}

function generateSampleAnalysis() {
  const { companyName, ticker, startDate, endDate, sampleEvents } = SAMPLE_COMPANY_DATA;
  
  let eventsHtml = '';
  let tableRows = '';
  
  sampleEvents.forEach((event, index) => {
    eventsHtml += `
#### ${index + 1}. ${event.title} — ${event.date}
The Story:
${event.story}

Management's Take:
${event.managementQuote}

Stock Impact:
${event.stockImpact}

📎 Source: [${event.source}](${event.source})
---
`;
    
    const impact = event.stockImpact.includes('rose') ? 'Stock up 5.2%' : 'Stock down 3.8%';
    tableRows += `| ${event.date} | ${event.title} | ${impact} | [Link](${event.source}) |\n`;
  });

  const analysis = `# Stock Analysis: ${ticker}
## Period: ${startDate} to ${endDate}
### Executive Summary
Apple Inc. (AAPL) experienced a volatile October 2024, with the stock swinging between positive earnings momentum and China market concerns. The company's strong Q4 results, beating revenue estimates by $1.2 billion, demonstrated resilience in core iPhone and services segments. However, geopolitical tensions and competitive pressures in China created headwinds that investors closely monitored throughout the month.

---
### Key Events
${eventsHtml}
### Quick Reference Table
| Date | Event | Impact | Source |
|------|-------|--------|--------|
${tableRows}
---
### Bottom Line
Apple's October performance highlighted both the company's operational strength and external market risks. While strong earnings show Apple's ability to navigate challenging environments, China exposure remains a key vulnerability that could impact future growth. Investors should monitor geopolitical developments and competitive dynamics in international markets while recognizing Apple's continued innovation and services diversification.

---
`;

  return analysis;
}

function showPlaceholder() {
  perplexityResultsEl.innerHTML = '<p id="perplexity-placeholder">Enter a query to generate comprehensive stock analysis...</p>';
}

async function generateStockAnalysis() {
  const companyName = companyNameEl.value.trim();
  const tickerSymbol = tickerSymbolEl.value.trim();
  const startDate = startDateEl.value;
  const endDate = endDateEl.value;

  if (!companyName || !tickerSymbol || !startDate || !endDate) {
    showError("Please fill in all fields");
    return;
  }

  if (!CONFIG.PERPLEXITY_API_KEY || CONFIG.PERPLEXITY_API_KEY === "YOUR_PERPLEXITY_API_KEY") {
    showError("Please configure your Perplexity API key");
    return;
  }

  showLoading();
  
  // Create the analysis query
  const analysisQuery = `Research ${companyName} (${tickerSymbol}) from ${startDate} to ${endDate}. Identify the 3-4 most significant events that explain price movements.`;

  try {
    const response = await fetch(CONFIG.PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a financial analyst writing a brief for retail investors. Provide clear, concise analysis of stock events and their impact on price movements."
          },
          {
            role: "user",
            content: analysisQuery
          }
        ],
        max_tokens: CONFIG.MAX_TOKENS,
        temperature: CONFIG.TEMPERATURE,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const answer = data.choices[0].message.content;
      showResponse(answer);
    } else {
      showError("No response received from Perplexity API");
    }
  } catch (error) {
    console.error("Perplexity API error:", error);
    showError(error.message || "Failed to get response from Perplexity API");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("stockName", (data) => {
    updateStockName(data.stockName);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.stockName) {
      updateStockName(changes.stockName.newValue);
    }
  });

  // Generate Analysis button functionality
  generateAnalysisBtn.addEventListener("click", async () => {
    generateAnalysisBtn.disabled = true;
    await generateStockAnalysis();
    generateAnalysisBtn.disabled = false;
  });

  // Auto-fill detected stock if available
  chrome.storage.local.get("stockName", (data) => {
    if (data.stockName && data.stockName !== "Not detected") {
      const stockInfo = data.stockName;
      // Try to extract company name and ticker from detected stock
      // This is a simple extraction - you might want to improve this logic
      if (stockInfo.includes('(') && stockInfo.includes(')')) {
        const tickerMatch = stockInfo.match(/\(([^)]+)\)/);
        const companyName = stockInfo.replace(/\s*\([^)]+\)\s*$/, '').trim();
        if (tickerMatch && companyName) {
          companyNameEl.value = companyName;
          tickerSymbolEl.value = tickerMatch[1];
        }
      }
    }
  });
});

document.addEventListener("dblclick", () => {
  console.log("Started observing hover values...");
  observeStockHover();
});
