// UI Elements
const stockNameEl = document.getElementById("stock-name");
const tickerBadgeEl = document.getElementById("ticker-badge");
const startDateDisplayEl = document.getElementById("start-date-display");
const endDateDisplayEl = document.getElementById("end-date-display");
const priceRangeEl = document.getElementById("price-range");
const priceChangeAmountEl = document.getElementById("price-change-amount");
const trendIconEl = document.getElementById("trend-icon");
const percentChangeEl = document.getElementById("percent-change");
const aiAnalysisEl = document.getElementById("ai-analysis");
const lastUpdatedEl = document.getElementById("last-updated");
const confidenceScoreEl = document.getElementById("confidence-score");
const starsEl = document.querySelectorAll(".star");

// Form Elements
const companyNameEl = document.getElementById("company-name");
const tickerSymbolEl = document.getElementById("ticker-symbol");
const startDateEl = document.getElementById("start-date");
const endDateEl = document.getElementById("end-date");
const generateAnalysisBtn = document.getElementById("generate-analysis-btn");
const perplexityResultsEl = document.getElementById("perplexity-results");

// Chat Elements
const chatToggleEl = document.getElementById("chat-toggle");
const chatInterfaceEl = document.getElementById("chat-interface");
const chatCloseEl = document.getElementById("chat-close");

// Load configuration
// Note: In a real Chrome extension, you'd typically use chrome.storage for sensitive data
const CONFIG = {
  PERPLEXITY_API_KEY: "YOUR_PERPLEXITY_API_KEY_HERE", // Replace with your actual API key
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

// Stock data management
let currentStockData = {
  stockName: "Apple Inc.",
  ticker: "AAPL",
  startDate: "Jan 1, 2025",
  endDate: "Jan 15, 2025",
  startPrice: 185.00,
  endPrice: 195.00,
  percentChange: 5.4,
  aiAnalysis: "Apple's stock has shown strong momentum over the past two weeks, driven by positive market sentiment and strong holiday sales data. The tech sector has been performing well, with AAPL benefiting from increased consumer spending. Analysts suggest continued growth potential, though investors should remain cautious of broader market volatility.",
  lastUpdated: "2 minutes ago",
  confidence: 87,
  hasError: false
};

function updateStockName(name) {
  stockNameEl.textContent = name || "Apple Inc.";
  currentStockData.stockName = name || "Apple Inc.";
}

function updateUI() {
  // Update stock info
  stockNameEl.textContent = currentStockData.stockName;
  tickerBadgeEl.textContent = currentStockData.ticker;
  startDateDisplayEl.textContent = currentStockData.startDate;
  endDateDisplayEl.textContent = currentStockData.endDate;
  
  // Update price info
  priceRangeEl.textContent = `$${currentStockData.startPrice.toFixed(2)} → $${currentStockData.endPrice.toFixed(2)}`;
  
  const isPositive = currentStockData.percentChange >= 0;
  const priceChange = currentStockData.endPrice - currentStockData.startPrice;
  
  // Update price change styling
  const priceChangeCard = document.getElementById("price-change-card");
  priceChangeCard.className = `card price-change-card ${isPositive ? 'positive' : 'negative'}`;
  
  trendIconEl.textContent = isPositive ? "📈" : "📉";
  trendIconEl.className = `trend-icon ${isPositive ? 'positive' : 'negative'}`;
  
  priceChangeAmountEl.textContent = `${isPositive ? '+' : ''}$${Math.abs(priceChange).toFixed(2)}`;
  priceChangeAmountEl.className = `price-change-amount ${isPositive ? 'positive' : 'negative'}`;
  
  percentChangeEl.className = `percent-change ${isPositive ? 'positive' : 'negative'}`;
  percentChangeEl.querySelector('.percent-value').textContent = `${isPositive ? '+' : ''}${currentStockData.percentChange}%`;
  percentChangeEl.querySelector('.percent-value').className = `percent-value ${isPositive ? 'positive' : 'negative'}`;
  
  // Update AI analysis
  aiAnalysisEl.textContent = currentStockData.aiAnalysis;
  
  // Update metadata
  lastUpdatedEl.textContent = `Updated ${currentStockData.lastUpdated}`;
  confidenceScoreEl.textContent = currentStockData.confidence;
  
  // Update stars
  const filledStars = Math.round(currentStockData.confidence / 20);
  starsEl.forEach((star, index) => {
    star.className = `star ${index < filledStars ? 'filled' : ''}`;
  });
}

function showLoading() {
  perplexityResultsEl.innerHTML = '<div class="loading">Getting AI response...</div>';
  aiAnalysisEl.textContent = "Analyzing stock data with AI...";
}

function showError(message) {
  perplexityResultsEl.innerHTML = `<div class="error">Error: ${message}</div>`;
  aiAnalysisEl.textContent = "Unable to generate analysis. Please try again.";
  currentStockData.hasError = true;
  updateUI();
}

function showResponse(response) {
  // Update the AI analysis with the response
  currentStockData.aiAnalysis = response;
  currentStockData.lastUpdated = "just now";
  currentStockData.confidence = Math.floor(Math.random() * 20) + 80; // Random confidence 80-100%
  
  updateUI();
  
  // Show the full response in results container
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
  perplexityResultsEl.innerHTML = '<p class="text-slate-400 text-center">Enter a query to generate comprehensive stock analysis...</p>';
}

// Chat functionality
function toggleChat() {
  chatInterfaceEl.classList.toggle('hidden');
}

function closeChat() {
  chatInterfaceEl.classList.add('hidden');
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
  // Initialize UI with default data
  updateUI();
  
  // Chrome storage listeners
  chrome.storage.local.get("stockName", (data) => {
    if (data.stockName && data.stockName !== "Not detected") {
      updateStockName(data.stockName);
      updateUI();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.stockName) {
      updateStockName(changes.stockName.newValue);
      updateUI();
    }
  });

  // Generate Analysis button functionality
  generateAnalysisBtn.addEventListener("click", async () => {
    generateAnalysisBtn.disabled = true;
    generateAnalysisBtn.textContent = "Analyzing...";
    await generateStockAnalysis();
    generateAnalysisBtn.disabled = false;
    generateAnalysisBtn.textContent = "Generate Analysis";
  });

  // Chat interface
  chatToggleEl.addEventListener("click", toggleChat);
  chatCloseEl.addEventListener("click", closeChat);

  // Auto-fill detected stock if available
  chrome.storage.local.get("stockName", (data) => {
    if (data.stockName && data.stockName !== "Not detected") {
      const stockInfo = data.stockName;
      // Try to extract company name and ticker from detected stock
      if (stockInfo.includes('(') && stockInfo.includes(')')) {
        const tickerMatch = stockInfo.match(/\(([^)]+)\)/);
        const companyName = stockInfo.replace(/\s*\([^)]+\)\s*$/, '').trim();
        if (tickerMatch && companyName) {
          currentStockData.stockName = companyName;
          currentStockData.ticker = tickerMatch[1];
          updateUI();
        }
      }
    }
  });
});

document.addEventListener("dblclick", () => {
  console.log("Started observing hover values...");
  observeStockHover();
});
