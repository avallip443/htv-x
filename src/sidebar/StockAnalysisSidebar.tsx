import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { AlertCircle, TrendingUp, TrendingDown, Calendar, Newspaper, Brain, MessageCircle, DollarSign, Star, ExternalLink, ChevronRight, Sparkles } from "lucide-react";

interface StockData {
  stockName: string;
  ticker: string;
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  percentChange: number;
  priceChange: number;
  aiAnalysis: string;
  lastUpdated?: string;
  confidence?: number;
  hasError?: boolean;
  errorMessage?: string;
}

interface StockAnalysisSidebarProps {
  data?: StockData;
}

// Chrome Extension Service for API calls
class ChromeExtensionService {
  static async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  static async getStorageData(key: string) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  static async setStorageData(key: string, value: any) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  static async generateAnalysis(ticker: string) {
    // Simulate API call to Perplexity or other AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockAnalysis = {
          stockName: this.getStockName(ticker),
          ticker: ticker,
          startDate: "Jan 1, 2025",
          endDate: "Jan 15, 2025",
          startPrice: 185.00,
          endPrice: 195.00,
          percentChange: 5.4,
          priceChange: 0.0, 
          aiAnalysis: `Based on recent market data for ${ticker}, the stock has shown positive momentum. Market sentiment appears favorable with strong technical indicators. Key drivers include positive earnings expectations and sector rotation. However, investors should monitor for potential volatility and consider risk management strategies.`,
          lastUpdated: "2 minutes ago",
          confidence: 87,
          hasError: false
        };
        resolve(mockAnalysis);
      }, 1500);
    });
  }

  static async sendMessageToGemini(message: string, ticker: string, stockData: any) {
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.";
    }
    
    const prompt = `You are a stock analysis assistant. Answer this question about ${ticker} (${stockData.stockName}):
  
  Stock Data:
  - Current Price: $${stockData.endPrice}
  - Price Change: ${stockData.percentChange}%
  - Period: ${stockData.startDate} to ${stockData.endDate}
  - AI Analysis: ${stockData.aiAnalysis}
  
  User Question: ${message}
  
  Please provide a helpful, professional response about this stock. Always include disclaimers about not being financial advice.`;
  
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data);
        return `API Error: ${data.error?.message || 'Unknown error'}`;
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      return `Connection Error: ${error.message}`;
    }
  }

  private static getStockName(ticker: string): string {
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
      'INTC': 'Intel Corporation'
    };
    return stockNames[ticker] || `${ticker} Corporation`;
  }
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function StockAnalysisSidebar({ data }: StockAnalysisSidebarProps) {
  const [showChat, setShowChat] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  const defaultData: StockData = {
    stockName: "",
    ticker: "",
    startDate: "",
    endDate: "",
    startPrice: 0.00,
    endPrice: 0.00,
    percentChange: 0.0,
    priceChange: 0.0,
    aiAnalysis: "",
    lastUpdated: "",
    confidence: 87,
    hasError: false
  };

  const currentData = stockData || data || defaultData;

  const parseStoredRange = (rangeText?: string) => {
    if (!rangeText) return { startDate: defaultData.startDate, endDate: defaultData.endDate };
    let start = rangeText;
    let end = rangeText;
    if (rangeText.includes("→")) {
      [start, end] = rangeText.split("→").map((s) => s.trim());
    } else if (rangeText.toLowerCase().includes(" to ")) {
      [start, end] = rangeText.split(/\s+to\s+/i).map((s) => s.trim());
    } else if (rangeText.includes("-")) {
      const parts = rangeText.split("-").map((s) => s.trim());
      if (parts.length >= 2) {
        start = parts[0];
        end = parts.slice(1).join(" - ");
      }
    }
    return { startDate: start, endDate: end };
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const results = await Promise.all([
          ChromeExtensionService.getStorageData('stockName'),
          ChromeExtensionService.getStorageData('stockTicker'),
          ChromeExtensionService.getStorageData('stockRange'),
        ]);
        const storedName = results[0] as string | undefined;
        const storedTicker = results[1] as string | undefined;
        const storedRange = results[2] as any;

        const stockRange = storedRange as any;
        const { startDate, endDate } = parseStoredRange(stockRange?.stockTimeRange);

        const merged: StockData = {
          stockName: storedName || defaultData.stockName,
          ticker: storedTicker || defaultData.ticker,
          startDate,
          endDate,
          startPrice: stockRange?.endPrice && stockRange?.priceChange 
            ? stockRange.endPrice - stockRange.priceChange 
            : defaultData.startPrice,
          endPrice: stockRange?.endPrice || defaultData.endPrice,
          percentChange: stockRange?.percentageChange ?? defaultData.percentChange,
          priceChange: stockRange?.priceChange || defaultData.priceChange,
          aiAnalysis: defaultData.aiAnalysis,
          lastUpdated: "just now",
          confidence: defaultData.confidence,
          hasError: false,
        };

        setStockData(merged);
      } catch (err) {
        console.error('Failed to initialize stock data from storage', err);
      }
    };

    initializeData();

    const onStorageChanged = (changes: any, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes.stockName || changes.stockTicker || changes.stockRange) {
        initializeData();
      }
    };

    chrome.storage.onChanged.addListener(onStorageChanged);

    return () => {
      try { chrome.storage.onChanged.removeListener(onStorageChanged); } catch { }
    };
  }, []);

  const handleGenerateAnalysis = async () => {
    setIsLoading(true);
    try {
      const analysis = await ChromeExtensionService.generateAnalysis('AAPL');
      setStockData(analysis as StockData);
      await ChromeExtensionService.setStorageData('stockAnalysis', analysis);
    } catch (error) {
      setStockData({
        ...defaultData,
        hasError: true,
        errorMessage: 'Failed to generate analysis. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentData) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Send to Gemini
      const response = await ChromeExtensionService.sendMessageToGemini(
        message, 
        currentData.ticker, 
        currentData
      );

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response as string,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    handleSendMessage(question);
  };

  const isPositive = currentData.priceChange >= 0;

  // Error state
  if (currentData.hasError) {
    return (
      <div className="w-[400px] h-screen bg-slate-900 p-6 flex items-center justify-center">
        <Card className="bg-red-950/30 border-red-900 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Analysis Error</h3>
          <p className="text-sm text-slate-300 mb-4">
            {currentData.errorMessage || "Unable to fetch stock data. Please try again later."}
          </p>
          <Button 
            onClick={handleGenerateAnalysis}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? "Generating..." : "Retry Analysis"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-screen bg-slate-900 overflow-y-auto flex flex-col">
      <div className="p-5 space-y-4 flex-1">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h1 className="text-lg font-bold text-emerald-500">Stock Insight AI</h1>
            </div>
            <Button 
              onClick={handleGenerateAnalysis}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {isLoading ? "Generating..." : "Refresh"}
            </Button>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2.5">{currentData.stockName}</h2>
            <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700 font-mono">
              {currentData.ticker}
            </Badge>
          </div>
        </div>

        {/* Date Range */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Date Range
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Start</p>
              <p className="text-white font-semibold">{currentData.startDate}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <div>
              <p className="text-slate-400 text-xs mb-1">End</p>
              <p className="text-white font-semibold">{currentData.endDate}</p>
            </div>
          </div>
        </Card>

        {/* Price Change */}
        <Card className={`p-4 border-2 ${
          isPositive 
            ? "bg-emerald-950/30 border-emerald-900" 
            : "bg-red-950/30 border-red-900"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Price Change
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-2">
                ${Number(currentData.startPrice).toFixed(2)} → ${Number(currentData.endPrice).toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-2xl font-bold ${
                  isPositive ? "text-emerald-500" : "text-red-500"
                }`}>
                  {isPositive ? "+" : ""}${currentData.priceChange}
                </span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              isPositive 
                ? "bg-emerald-900/50" 
                : "bg-red-900/50"
            }`}>
              <p className={`text-2xl font-bold ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}>
                {isPositive ? "+" : ""}{currentData.percentChange}%
              </p>
            </div>
          </div>
        </Card>

        {/* AI Summary */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              AI Summary
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {currentData.aiAnalysis}
          </p>
        </Card>

        {/* Data Sources */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Data Sources
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <a href="#" className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Yahoo Finance</p>
                <p className="text-[10px] text-slate-400">Price Data</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
            </a>
            
            <a href="#" className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group">
              <Newspaper className="w-4 h-4 text-emerald-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Alpha Vantage</p>
                <p className="text-[10px] text-slate-400">News (50+)</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
            </a>
            
            <a href="#" className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group">
              <Brain className="w-4 h-4 text-purple-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">OpenAI GPT-4</p>
                <p className="text-[10px] text-slate-400">Analysis</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
            </a>
            
            <a href="#" className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group">
              <MessageCircle className="w-4 h-4 text-orange-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">StockTwits</p>
                <p className="text-[10px] text-slate-400">Sentiment</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
            </a>
          </div>
        </Card>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated {currentData.lastUpdated}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Confidence: {currentData.confidence}%</span>
            <div className="flex items-center gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round((currentData.confidence || 0) / 20)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <a href="#" className="block text-center text-xs text-emerald-500 hover:text-emerald-400 font-medium">
          Learn about our methodology →
        </a>

        {/* Disclaimer */}
        <Card className="bg-amber-950/20 border-amber-900/50 p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-500 mb-1">⚠️ Disclaimer</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                This analysis is for educational purposes only. Not financial advice. Always do your own research before investing.
              </p>
            </div>
          </div>
        </Card>

        {/* Chat CTA */}
        <Button
          onClick={() => setShowChat(!showChat)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 text-sm"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Continue the conversation
        </Button>

        {/* Chat Interface (shown when clicked) */}
        {showChat && (
          <Card className="bg-slate-800 border-slate-700 p-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-slate-400">Ask me anything about {currentData.ticker}</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="max-h-48 overflow-y-auto mb-3 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-sm text-white mb-2">Try asking:</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleQuickQuestion("What's driving this price change?")}
                      className="w-full text-left text-xs text-slate-300 hover:text-white p-2 rounded bg-slate-600/50 hover:bg-slate-600 transition-colors"
                    >
                      "What's driving this price change?"
                    </button>
                    <button 
                      onClick={() => handleQuickQuestion("Should I buy or sell?")}
                      className="w-full text-left text-xs text-slate-300 hover:text-white p-2 rounded bg-slate-600/50 hover:bg-slate-600 transition-colors"
                    >
                      "Should I buy or sell?"
                    </button>
                    <button 
                      onClick={() => handleQuickQuestion("What are the risks?")}
                      className="w-full text-left text-xs text-slate-300 hover:text-white p-2 rounded bg-slate-600/50 hover:bg-slate-600 transition-colors"
                    >
                      "What are the risks?"
                    </button>
                  </div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                      message.isUser 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-700 text-slate-200'
                    }`}>
                      {message.text}
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 p-2 rounded-lg text-xs text-slate-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                placeholder="Ask about the stock..."
                className="flex-1 px-3 py-2 bg-slate-700 text-white text-xs rounded-lg border border-slate-600 focus:outline-none focus:border-emerald-500"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping}
                className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
