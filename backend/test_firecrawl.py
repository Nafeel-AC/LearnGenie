#!/usr/bin/env python3
"""
Test script for Firecrawl integration in AI Tutor
"""

import os
from dotenv import load_dotenv

def test_firecrawl():
    """Test Firecrawl API integration"""
    print("🔥 Testing Firecrawl Integration")
    print("=" * 40)
    
    # Load environment variables
    load_dotenv()
    
    # Check for API key
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        print("❌ FIRECRAWL_API_KEY not found in .env file")
        print("\n📝 Please add your Firecrawl API key to the .env file:")
        print("FIRECRAWL_API_KEY=fc-your_api_key_here")
        print("\n🔗 Get your API key from: https://firecrawl.dev/")
        return False
    
    # Test Firecrawl import
    try:
        from firecrawl import FirecrawlApp
        print("✅ Firecrawl library imported successfully")
    except ImportError:
        print("❌ Firecrawl library not installed")
        print("💡 Install with: pip install firecrawl-py")
        return False
    
    # Test API connection
    try:
        app = FirecrawlApp(api_key=api_key)
        print("✅ Firecrawl API initialized")
        
        # Test with a simple webpage
        test_url = "https://example.com"
        print(f"🌐 Testing scraping: {test_url}")
        
        result = app.scrape_url(test_url, formats=['markdown'])
        
        if result:
            content = getattr(result, 'markdown', '') or ''
            metadata = getattr(result, 'metadata', {}) or {}
            
            print("✅ Scraping successful!")
            print(f"📄 Content length: {len(content)} characters")
            if isinstance(metadata, dict):
                print(f"📋 Title: {metadata.get('title', 'N/A')}")
                print(f"🔍 Status: {metadata.get('statusCode', 'N/A')}")
            else:
                print(f"📋 Title: N/A")
                print(f"🔍 Status: N/A")
            
            if len(content) > 100:
                print("✅ Content extraction working properly")
                return True
            else:
                print("⚠️  Warning: Content seems too short")
                return False
        else:
            print("❌ Scraping failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Firecrawl: {e}")
        return False

def main():
    """Main test function"""
    success = test_firecrawl()
    
    if success:
        print("\n🎉 Firecrawl integration test passed!")
        print("✅ Ready to use web scraping in AI Tutor")
    else:
        print("\n❌ Firecrawl integration test failed")
        print("🔧 Please check your configuration and try again")

if __name__ == "__main__":
    main() 