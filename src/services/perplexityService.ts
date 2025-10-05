/**
 * Perplexity API Service for Financial Analysis
 * Integrates with Perplexity API to generate comprehensive stock analysis
 */

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface StockAnalysisParams {
  ticker: string;
  companyName: string;
  startDate: string;
  endDate: string;
}

export class PerplexityService {
  private static readonly API_KEY = process.env.PERPLEXITY_API_KEY;
  private static readonly BASE_URL = 'https://api.perplexity.ai/chat/completions';

  /**
   * Generate comprehensive stock analysis using Perplexity
   */
  static async generateStockAnalysis(params: StockAnalysisParams): Promise<string> {
    if (!this.API_KEY) {
      throw new Error('Perplexity API key not configured. Please add PERPLEXITY_API_KEY to your environment variables.');
    }

    const prompt = this.buildAnalysisPrompt(params);

    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a financial analyst writing comprehensive stock analysis reports. Always provide structured, factual analysis with proper formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
          top_p: 0.9,
          return_citations: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Perplexity API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: PerplexityResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Perplexity API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  }

  /**
   * Build the comprehensive analysis prompt
   */
  private static buildAnalysisPrompt(params: StockAnalysisParams): string {
    const { ticker, companyName, startDate, endDate } = params;
    
    return `You are a financial analyst writing a brief for retail investors.
Research ${companyName} (${ticker}) from ${startDate} to ${endDate}.
Identify the 3-4 most significant events that explain price movements.

OUTPUT FORMAT:
## Summary
[Less than 50 words: What happened to the stock? What were the main drivers? Keep it extremely brief and simple.]
---
## Key Events
### [Event Title] — [Date]
[Brief, simple description: 1-2 short sentences explaining what happened. Use simple language that anyone can understand. Do NOT include any reference numbers in the description.]
📎 Source: [Source Name]
---
### [Event Title] — [Date]
[Brief, simple description: 1-2 short sentences. Do NOT include any reference numbers in the description.]
📎 Source: [Source Name]
---
### [Event Title] — [Date] (if needed)
[Same structure. Do NOT include any reference numbers in the description.]
📎 Source: [Source Name]
---
### Sources
[List all unique sources cited in the Key Events section, formatted as: 1. [Source Name] - [Source URL] 2. [Source Name] - [Source URL] etc. Use the actual news source name (e.g., "NY Times", "CNBC", "Reuters").]
---

GUIDELINES:
- Summary must be less than 50 words
- Each event description must be 1-2 short, simple sentences
- Maximum 3 events
- Total length: 150-250 words (much shorter overall)
- Use very simple language that anyone can understand
- Avoid financial jargon and complex terms
- Include both good and bad news
- Prioritize events before price moves
- Dates from document bodies only
- Write like you're explaining to a friend, not a financial expert
- All sources must be listed at the end under the '### Sources' heading, with numbered source names and URLs
- Each event description should NOT contain any reference numbers - keep descriptions clean
- Source references appear separately under each event as "📎 Source: [Source Name]" using the actual news source name
- Use actual news source names (e.g., "NY Times", "CNBC", "Reuters") in both the source lines and Sources section
- NO additional sections after '### Sources' (no tables, no bottom line, nothing else)

CRITICAL WRITING RULES:
1. Executive Summary - Lead with Impact: Open with the most dramatic fact (biggest loss, largest gain, most shocking revelation), then explain causes
2. Before/After Framing: In each event's description, the first sentence should establish what the situation was BEFORE the event, then show how it changed AFTER
   - Example: "Meta had never lost daily users in its 18-year history. Then Q4 2021 revealed the first decline, dropping 500,000 users as TikTok captured younger audiences."
   - NOT: "Meta reported a decline in daily users in Q4 2021."

Please provide a comprehensive analysis following this exact format.`;
  }

  /**
   * Get company name from ticker symbol
   */
  static getCompanyName(ticker: string): string {
    const stockNames: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices',
      'INTC': 'Intel Corporation',
      'GOOG': 'Alphabet Inc.',
      'BRK.A': 'Berkshire Hathaway Inc.',
      'BRK.B': 'Berkshire Hathaway Inc.',
      'UNH': 'UnitedHealth Group Inc.',
      'JNJ': 'Johnson & Johnson',
      'XOM': 'Exxon Mobil Corporation',
      'JPM': 'JPMorgan Chase & Co.',
      'V': 'Visa Inc.',
      'PG': 'Procter & Gamble Co.',
      'MA': 'Mastercard Inc.',
      'HD': 'Home Depot Inc.',
      'CVX': 'Chevron Corporation',
      'ABBV': 'AbbVie Inc.',
      'PFE': 'Pfizer Inc.',
      'BAC': 'Bank of America Corp.',
      'KO': 'Coca-Cola Company',
      'AVGO': 'Broadcom Inc.',
      'PEP': 'PepsiCo Inc.',
      'TMO': 'Thermo Fisher Scientific Inc.',
      'COST': 'Costco Wholesale Corporation',
      'WMT': 'Walmart Inc.',
      'MRK': 'Merck & Co. Inc.',
      'ABT': 'Abbott Laboratories',
      'ACN': 'Accenture plc',
      'VZ': 'Verizon Communications Inc.',
      'ADBE': 'Adobe Inc.',
      'TXN': 'Texas Instruments Inc.',
      'NKE': 'Nike Inc.',
      'CRM': 'Salesforce Inc.',
      'LIN': 'Linde plc',
      'NEE': 'NextEra Energy Inc.',
      'T': 'AT&T Inc.',
      'QCOM': 'QUALCOMM Inc.',
      'PM': 'Philip Morris International Inc.',
      'DHR': 'Danaher Corporation',
      'UNP': 'Union Pacific Corporation',
      'RTX': 'Raytheon Technologies Corporation',
      'IBM': 'International Business Machines Corporation',
      'LOW': 'Lowe\'s Companies Inc.',
      'SPGI': 'S&P Global Inc.',
      'INTU': 'Intuit Inc.',
      'CAT': 'Caterpillar Inc.',
      'GE': 'General Electric Company',
      'AMAT': 'Applied Materials Inc.',
      'AXP': 'American Express Company',
      'BKNG': 'Booking Holdings Inc.',
      'SYK': 'Stryker Corporation',
      'GILD': 'Gilead Sciences Inc.',
      'CVS': 'CVS Health Corporation',
      'BLK': 'BlackRock Inc.',
      'ADP': 'Automatic Data Processing Inc.',
      'MDT': 'Medtronic plc',
      'GS': 'Goldman Sachs Group Inc.',
      'ISRG': 'Intuitive Surgical Inc.',
      'TJX': 'TJX Companies Inc.',
      'CB': 'Chubb Limited',
      'MMC': 'Marsh & McLennan Companies Inc.',
      'PLD': 'Prologis Inc.',
      'ELV': 'Elevance Health Inc.',
      'SO': 'Southern Company',
      'ZTS': 'Zoetis Inc.',
      'DUK': 'Duke Energy Corporation',
      'BDX': 'Becton Dickinson and Company',
      'BSX': 'Boston Scientific Corporation',
      'AON': 'Aon plc',
      'SHW': 'Sherwin-Williams Company',
      'CL': 'Colgate-Palmolive Company',
      'ITW': 'Illinois Tool Works Inc.',
      'ECL': 'Ecolab Inc.',
      'CME': 'CME Group Inc.',
      'ICE': 'Intercontinental Exchange Inc.',
      'APD': 'Air Products and Chemicals Inc.',
      'SLB': 'Schlumberger Limited',
      'HCA': 'HCA Healthcare Inc.',
      'NSC': 'Norfolk Southern Corporation',
      'PSA': 'Public Storage',
      'AEP': 'American Electric Power Company Inc.',
      'EXC': 'Exelon Corporation',
      'ETN': 'Eaton Corporation plc',
      'CTAS': 'Cintas Corporation',
      'EQIX': 'Equinix Inc.',
      'WEC': 'WEC Energy Group Inc.',
      'XEL': 'Xcel Energy Inc.',
      'ES': 'Eversource Energy',
      'AWK': 'American Water Works Company Inc.',
      'SRE': 'Sempra Energy',
      'ED': 'Consolidated Edison Inc.',
      'EIX': 'Edison International',
      'EXR': 'Extra Space Storage Inc.',
      'NTRS': 'Northern Trust Corporation',
      'RMD': 'ResMed Inc.',
      'CHTR': 'Charter Communications Inc.',
      'YUM': 'Yum! Brands Inc.',
      'ROST': 'Ross Stores Inc.',
      'KMB': 'Kimberly-Clark Corporation',
      'MCO': 'Moody\'s Corporation',
      'PAYX': 'Paychex Inc.',
      'LHX': 'L3Harris Technologies Inc.',
      'ALL': 'Allstate Corporation',
      'ILMN': 'Illumina Inc.',
      'FTNT': 'Fortinet Inc.',
      'STZ': 'Constellation Brands Inc.',
      'MRNA': 'Moderna Inc.',
      'PCAR': 'PACCAR Inc.',
      'IDXX': 'IDEXX Laboratories Inc.',
      'ALGN': 'Align Technology Inc.',
      'CTSH': 'Cognizant Technology Solutions Corporation',
      'FAST': 'Fastenal Company',
      'VRSK': 'Verisk Analytics Inc.',
      'ANSS': 'ANSYS Inc.',
      'WBA': 'Walgreens Boots Alliance Inc.',
      'CPRT': 'Copart Inc.',
      'KLAC': 'KLA Corporation',
      'CDNS': 'Cadence Design Systems Inc.',
      'MCHP': 'Microchip Technology Inc.',
      'SNPS': 'Synopsys Inc.',
      'MTD': 'Mettler-Toledo International Inc.',
      'FANG': 'Diamondback Energy Inc.',
      'DXCM': 'DexCom Inc.',
      'WY': 'Weyerhaeuser Company',
      'CNC': 'Centene Corporation',
      'CINF': 'Cincinnati Financial Corporation',
      'DLTR': 'Dollar Tree Inc.',
      'INCY': 'Incyte Corporation',
      'IEX': 'IDEX Corporation',
      'BIIB': 'Biogen Inc.',
      'EXPD': 'Expeditors International of Washington Inc.',
      'NTAP': 'NetApp Inc.',
      'VRSN': 'VeriSign Inc.',
      'FDS': 'FactSet Research Systems Inc.',
      'CHKP': 'Check Point Software Technologies Ltd.',
      'MKTX': 'MarketAxess Holdings Inc.',
      'PKI': 'PerkinElmer Inc.',
      'FTV': 'Fortive Corporation',
      'TER': 'Teradyne Inc.',
      'XYL': 'Xylem Inc.',
      'HSIC': 'Henry Schein Inc.',
      'KEYS': 'Keysight Technologies Inc.',
      'HOLX': 'Hologic Inc.',
      'CTXS': 'Citrix Systems Inc.',
      'BR': 'Broadridge Financial Solutions Inc.',
      'NDSN': 'Nordson Corporation',
      'SWKS': 'Skyworks Solutions Inc.',
      'MASI': 'Masimo Corporation',
      'NLOK': 'NortonLifeLock Inc.',
      'LRCX': 'Lam Research Corporation',
      'ZBH': 'Zimmer Biomet Holdings Inc.',
      'SIVB': 'SVB Financial Group',
      'TECH': 'Bio-Techne Corporation',
      'AKAM': 'Akamai Technologies Inc.',
      'QRVO': 'Qorvo Inc.',
      'CRL': 'Charles River Laboratories International Inc.',
      'POOL': 'Pool Corporation',
      'JBHT': 'J.B. Hunt Transport Services Inc.',
      'WAT': 'Waters Corporation',
      'MSCI': 'MSCI Inc.',
      'LDOS': 'Leidos Holdings Inc.'
    };
    
    return stockNames[ticker] || `${ticker} Corporation`;
  }

  /**
   * Format dates for the analysis
   */
  static formatDateForAnalysis(date: string): string {
    // Convert various date formats to readable format
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return date; // Return as-is if parsing fails
    }
  }
}
