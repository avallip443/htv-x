import { Perplexity } from '@perplexity-ai/perplexity_ai';


//import { GoogleGenAI } from "@google/genai";

COMPANY_NAME = "Example Corp";
TICKER = "EXMPL";
START_DATE = "2023-01-01";
END_DATE = "2023-12-31";

const prompt = `“You are a financial analyst writing a brief for retail investors.
Research ${COMPANY_NAME} (${TICKER}) from ${START_DATE} to ${END_DATE}.
Identify the 3-4 most significant events that explain price movements.
OUTPUT FORMAT:
# Stock Analysis: [TICKER]
## Period: [START_DATE] to [END_DATE]
### Executive Summary
[3-4 sentences: What happened to the stock? What were the main drivers? What should investors know?]
---
### Key Events
#### 1. [Event Title] — [Date]
The Story:
[3-4 sentences explaining what happened, using company's own words/numbers when possible]
Management's Take:
[1-2 sentence quote or paraphrase from CEO/CFO, if available]
Stock Impact:
[2 sentences: Why did this move the stock? What was the market's reaction?]
📎 Source: [Direct link]
---
#### 2. [Event Title] — [Date]
The Story:
[3-4 sentences]
Management's Take:
[1-2 sentences]
Stock Impact:
[2 sentences]
📎 Source: [Link]
---
#### 3. [Event Title] — [Date] (if needed)
[Same structure]
---
### Quick Reference Table
| Date | Event | Impact | Source |
|------|-------|--------|--------|
| Oct 23 | Earnings miss | Stock down 15% | [Link] |
| Oct 25 | New product launch | Stock up 8% | [Link] |
---
### Bottom Line
[2-3 sentences: What do these events tell us about the company's position, risks, and opportunities?]
---
GUIDELINES:
- Total length: 400-600 words
- Each event: 100-150 words
- Plain English, minimal jargon
- Include both good and bad news
- Prioritize events before price moves
- One authoritative source per event
- Dates from document bodies only
CRITICAL WRITING RULES:
1. Executive Summary - Lead with Impact: Open with the most dramatic fact (biggest loss, largest gain, most shocking revelation), then explain causes
2. Before/After Framing: In each event's "Story" section, the first sentence should establish what the situation was BEFORE the event, then show how it changed AFTER
   - Example: "Meta had never lost daily users in its 18-year history. Then Q4 2021 revealed the first decline, dropping 500,000 users as TikTok captured younger audiences."
   - NOT: "Meta reported a decline in daily users in Q4 2021."
`


// The client gets the API key from the environment variable `GEMINI_API_KEY`.
//const ai = new GoogleGenAI({});

/* async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking
        },
      }
  });
  console.log(response.text);
} */


/*   fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_PERPLEXITY_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: prompt }]
    })
  })
    .then(res => res.json())
    .then(data => {
      sendResponse({ summary: data.choices?.[0]?.message?.content });
    })
    .catch(err => {
      console.error(err);
      sendResponse({ summary: "Error fetching data" });
    });

  return true; // keeps the message channel open
; */