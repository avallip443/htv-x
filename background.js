chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

const FACTSET_API_KEY = "YOUR_FACTSET_KEY";
const PERPLEXITY_API_KEY = "YOUR_PERPLEXITY_KEY";

async function getFactsetNews(ticker, startDate, endDate) {
  const url = "https://api.factset.com/content/news/v1/stories";
  const headers = {
    Authorization: `Bearer ${FACTSET_API_KEY}`,
    Accept: "application/json",
  };
  const params = new URLSearchParams({
    sources: "Businesswire,PR Newswire",
    tickers: ticker,
    startDate,
    endDate,
    limit: 10,
  });

  const res = await fetch(`${url}?${params}`, { headers });
  if (!res.ok) throw new Error("FactSet API request failed");
  const data = await res.json();
  return (
    data.data?.map((a) => ({
      headline: a.attributes.headline,
      source: a.attributes.source,
      date: a.attributes.date,
      body: a.attributes.body,
    })) || []
  );
}

async function summarizeArticle(title, text, company, ticker) {
  const url = "https://api.perplexity.ai/chat/completions";
  const headers = {
    Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    "Content-Type": "application/json",
  };

  const prompt = `
  Summarize this article related to ${company} (${ticker}) in 3 concise bullet points.
  Focus on financial or business impacts only.
  
  Title: ${title}
  Text: ${text.slice(0, 1500)}
  `;

  const body = {
    model: "pplx-7b-chat",
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Perplexity API request failed");
  const json = await res.json();
  return json?.choices?.[0]?.message?.content || "No summary available.";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_SUMMARIES") {
    (async () => {
      try {
        const { company, ticker, startDate, endDate } = message;
        const articles = await getFactsetNews(ticker, startDate, endDate);
        const summaries = [];
        for (const a of articles) {
          const summary = await summarizeArticle(
            a.headline,
            a.body,
            company,
            ticker
          );
          summaries.push({ ...a, summary });
        }
        sendResponse({ summaries });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // keep message channel open for async
  }
});





