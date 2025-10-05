import requests
from datetime import datetime, timedelta
import json
from typing import List, Dict, Any, Set, Tuple

# Alpha Vantage API configuration
ALPHA_VANTAGE_API_KEY = "JX9QN9791H5H0G1L"
NEWS_SENTIMENT_ENDPOINT = "https://www.alphavantage.co/query"

# List of allowed news sources
ALLOWED_SOURCES = {
    'financial times',
    'economic times',
    'business insider',
    'cnbc'
}

def get_news_sentiment(tickers: str, time_from: str = None, time_to: str = None, limit: int = 1000) -> Tuple[List[Dict[str, Any]], Set[str]]:
    """
    Fetch news sentiment data from Alpha Vantage API
    
    Args:
        tickers: Comma-separated list of ticker symbols
        time_from: Start time in YYYYMMDDTHHMM format (e.g., 20250128T0000)
        time_to: End time in YYYYMMDDTHHMM format (e.g., 20250228T2359)
        limit: Maximum number of results to return (1-1000)
        
    Returns:
        Tuple of (news_items, all_sources)
    """
    params = {
        'function': 'NEWS_SENTIMENT',
        'tickers': tickers,
        'limit': min(1000, max(1, limit)),
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    
    if time_from:
        params['time_from'] = time_from
    if time_to:
        params['time_to'] = time_to
    
    try:
        response = requests.get(NEWS_SENTIMENT_ENDPOINT, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Check if we got a valid response
        if 'feed' not in data:
            print(f"Unexpected API response: {data}")
            return [], set()
            
        news_items = data['feed']
        
        # Extract all unique sources
        all_sources = set()
        for item in news_items:
            if 'source' in item and item['source']:
                all_sources.add(item['source'].lower())
        
        return news_items, all_sources
        
    except Exception as e:
        print(f"Error fetching news from Alpha Vantage: {e}")
        return [], set()

def filter_news_by_sources(news_items: List[Dict[str, Any]], allowed_sources: Set[str]) -> List[Dict[str, Any]]:
    """Filter news items by allowed sources"""
    filtered = []
    for item in news_items:
        if 'source' in item and item['source']:
            source_lower = item['source'].lower()
            if any(allowed in source_lower for allowed in allowed_sources):
                filtered.append(item)
    return filtered

def print_news(news_items: List[Dict[str, Any]], limit: int = 10) -> None:
    """Print news items in a readable format"""
    if not news_items:
        print("No news items to display.")
        return
        
    print(f"\nDisplaying {min(limit, len(news_items))} of {len(news_items)} articles:")
    print("-" * 80)
    
    for i, item in enumerate(news_items[:limit], 1):
        print(f"\n--- Article {i} ---")
        print(f"Title: {item.get('title', 'N/A')}")
        print(f"Source: {item.get('source', 'N/A')}")
        print(f"Date: {item.get('time_published', 'N/A')}")
        print(f"URL: {item.get('url', 'N/A')}")
        print(f"Summary: {item.get('summary', 'No summary available.')[:200]}...")
        print("-" * 80)

def save_to_json(data: List[Dict[str, Any]], filename: str) -> None:
    """Save data to a JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nSaved {len(data)} articles to {filename}")
    except Exception as e:
        print(f"Error saving to file: {e}")

def main():
    try:
        # Default values
        tickers = "META"  # Default ticker
        time_from = "20250128T0000"  # Default from finnhub.http (2025-01-28)
        time_to = "20250228T2359"    # Default to end of day on 2025-02-28
        
        # Get user input
        try:
            tickers_input = input(f"Enter ticker symbols (comma-separated, default {tickers}): ").strip()
            if tickers_input:
                tickers = tickers_input.upper()
                
            from_input = input(f"Start date (YYYYMMDD, default {time_from[:8]}): ").strip()
            if from_input:
                time_from = f"{from_input}T0000"
                
            to_input = input(f"End date (YYYYMMDD, default {time_to[:8]}): ").strip()
            if to_input:
                time_to = f"{to_input}T2359"
                
        except (EOFError, KeyboardInterrupt):
            print("\nUsing default values...")
        
        print(f"\nFetching news for {tickers} from {time_from} to {time_to}...")
        
        # Get all news to see available sources
        all_news, all_sources = get_news_sentiment(
            tickers=tickers,
            time_from=time_from,
            time_to=time_to,
            limit=1000
        )
        
        if not all_news:
            print("\nNo news articles found for the specified period.")
            return
            
        # Show available sources
        print(f"\nFound {len(all_news)} total articles from {len(all_sources)} unique sources.")
        print("\nAvailable sources:")
        for i, source in enumerate(sorted(all_sources), 1):
            print(f"{i}. {source}")
        
        # Filter news by allowed sources
        filtered_news = filter_news_by_sources(all_news, ALLOWED_SOURCES)
        
        if filtered_news:
            print(f"\nFound {len(filtered_news)} articles from selected sources:")
            print_news(filtered_news)
            
            # Ask to save results
            try:
                save_option = input("\nWould you like to save these results to a JSON file? (y/N): ").strip().lower()
                if save_option == 'y':
                    default_filename = f"{tickers.lower().replace(',', '_')}_news_{time_from[:8]}_{time_to[:8]}.json"
                    filename = input(f"Enter filename (default: {default_filename}): ").strip()
                    filename = filename if filename else default_filename
                    save_to_json(filtered_news, filename)
            except (EOFError, KeyboardInterrupt):
                print("\nSkipping save to file.")
        else:
            print("\nNo articles found from the specified sources.")
            
            # Show the most common sources
            from collections import Counter
            sources = [item.get('source', 'Unknown') for item in all_news if 'source' in item]
            if sources:
                print("\nMost common sources in this period:")
                for source, count in Counter(sources).most_common(10):
                    print(f"- {source}: {count} articles")
            
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        import traceback
        traceback.print_exc()
        print("\nPlease make sure you have a stable internet connection and try again.")

if __name__ == "__main__":
    main()
