/**
 * Alpha Vantage API Service for News Sentiment Analysis
 * Integrates with Alpha Vantage API to get sentiment data
 */

interface AlphaVantageResponse {
  feed: Array<{
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: Array<{
      topic: string;
      relevance_score: string;
    }>;
    overall_sentiment_score: number;
    overall_sentiment_label: string;
    ticker_sentiment: Array<{
      ticker: string;
      relevance_score: string;
      ticker_sentiment_score: string;
      ticker_sentiment_label: string;
    }>;
  }>;
  information?: string;
  sentiment_score_definition?: string;
  relevance_score_definition?: string;
}

interface SentimentAnalysisResult {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  explanation: string;
  totalArticles: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

export class AlphaVantageService {
  private static readonly API_KEY = "JX9QN9791H5H0G1L";
  private static readonly BASE_URL = "https://www.alphavantage.co/query";

  /**
   * Get sentiment analysis for a ticker over a specific time period
   */
  static async getSentimentAnalysis(
    ticker: string, 
    startDate: string, 
    endDate: string
  ): Promise<SentimentAnalysisResult> {
    try {
      // Format dates for Alpha Vantage API (YYYYMMDDTHHMM format)
      const fromDate = this.formatDateForAPI(startDate);
      const toDate = this.formatDateForAPI(endDate);

      const params = {
        function: 'NEWS_SENTIMENT',
        tickers: ticker,
        limit: 1000,
        time_from: fromDate,
        time_to: toDate,
        apikey: this.API_KEY
      };

      // Build URL with query parameters
      const url = new URL(this.BASE_URL);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });

      console.log('Alpha Vantage API URL:', url.toString());
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AlphaVantageResponse = await response.json();
      console.log('Alpha Vantage API Response:', data);

      if (data.information) {
        throw new Error(`API limit reached: ${data.information}`);
      }

      if (!data.feed || data.feed.length === 0) {
        return {
          overallSentiment: 'neutral',
          confidence: 0,
          explanation: 'No news data available for this period.',
          totalArticles: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0
        };
      }

      // Analyze sentiment from news articles
      return this.analyzeSentimentFromNews(data.feed, ticker);

    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return {
        overallSentiment: 'neutral',
        confidence: 0,
        explanation: 'Unable to fetch sentiment data.',
        totalArticles: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0
      };
    }
  }

  /**
   * Analyze sentiment from news articles
   */
  private static analyzeSentimentFromNews(
    articles: AlphaVantageResponse['feed'], 
    ticker: string
  ): SentimentAnalysisResult {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let totalSentimentScore = 0;
    let relevantArticles = 0;

    articles.forEach(article => {
      // Find ticker-specific sentiment
      const tickerSentiment = article.ticker_sentiment.find(
        t => t.ticker === ticker
      );

      if (tickerSentiment && parseFloat(tickerSentiment.relevance_score) > 0.5) {
        const sentimentScore = parseFloat(tickerSentiment.ticker_sentiment_score);
        const sentimentLabel = tickerSentiment.ticker_sentiment_label.toLowerCase();

        totalSentimentScore += sentimentScore;
        relevantArticles++;

        if (sentimentLabel.includes('bullish')) {
          positiveCount++;
        } else if (sentimentLabel.includes('bearish')) {
          negativeCount++;
        } else {
          neutralCount++;
        }
      }
    });

    if (relevantArticles === 0) {
      return {
        overallSentiment: 'neutral',
        confidence: 0,
        explanation: 'No relevant news found for this ticker.',
        totalArticles: articles.length,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0
      };
    }

    const averageSentiment = totalSentimentScore / relevantArticles;
    const confidence = Math.min(95, Math.max(50, relevantArticles * 10));

    let overallSentiment: 'bullish' | 'bearish' | 'neutral';
    let explanation: string;

    if (averageSentiment > 0.1) {
      overallSentiment = 'bullish';
      explanation = `${positiveCount} positive and ${negativeCount} negative news articles drove optimistic sentiment.`;
    } else if (averageSentiment < -0.1) {
      overallSentiment = 'bearish';
      explanation = `${negativeCount} negative and ${positiveCount} positive news articles drove pessimistic sentiment.`;
    } else {
      overallSentiment = 'neutral';
      explanation = `Mixed news coverage with ${positiveCount} positive, ${negativeCount} negative, and ${neutralCount} neutral articles.`;
    }

    // Make explanation shorter and use simpler language
    if (explanation.length > 80) {
      if (overallSentiment === 'bullish') {
        explanation = 'Positive news coverage outweighs negative sentiment.';
      } else if (overallSentiment === 'bearish') {
        explanation = 'Negative news coverage outweighs positive sentiment.';
      } else {
        explanation = 'Mixed news coverage creates balanced sentiment.';
      }
    }

    return {
      overallSentiment,
      confidence: Math.round(confidence),
      explanation,
      totalArticles: articles.length,
      positiveCount,
      negativeCount,
      neutralCount
    };
  }

  /**
   * Format date for Alpha Vantage API
   */
  private static formatDateForAPI(dateString: string): string {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}T0000`;
    } catch (error) {
      // Fallback to 30 days ago
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() - 30);
      const year = fallbackDate.getFullYear();
      const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
      const day = String(fallbackDate.getDate()).padStart(2, '0');
      return `${year}${month}${day}T0000`;
    }
  }
}
