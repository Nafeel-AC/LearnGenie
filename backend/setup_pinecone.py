#!/usr/bin/env python3
"""
Pinecone Setup Script for AI Tutor RAG System
This script helps set up your Pinecone index for the AI Tutor.
"""

import os
import sys
from dotenv import load_dotenv

def main():
    print("🔧 Pinecone Setup for AI Tutor RAG System")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Check for API key
    api_key = os.getenv("PINECONE_API_KEY")
    host_url = os.getenv("PINECONE_HOST")
    
    if not api_key:
        print("❌ PINECONE_API_KEY not found in .env file")
        print("\n📝 Please add your Pinecone configuration to the .env file:")
        print("PINECONE_API_KEY=your_pinecone_api_key_here")
        print("PINECONE_HOST=your_pinecone_host_url_here")
        print("\n🔗 Get your API key from: https://www.pinecone.io/")
        return
    
    if not host_url:
        print("⚠️  PINECONE_HOST not found in .env file")
        print("💡 This may be required for newer Pinecone indexes")
    
    try:
        from pinecone import Pinecone, ServerlessSpec
        print("✅ Pinecone library found")
    except ImportError:
        print("❌ Pinecone library not installed")
        print("💡 Install with: pip install pinecone-client")
        return
    
    try:
        # Initialize Pinecone
        pc = Pinecone(api_key=api_key)
        print("✅ Connected to Pinecone")
        
        # Get index name
        index_name = os.getenv("PINECONE_INDEX_NAME", "tutor-rag-index")
        print(f"📊 Using index name: {index_name}")
        
        # Check existing indexes
        existing_indexes = [index.name for index in pc.list_indexes()]
        print(f"📋 Existing indexes: {existing_indexes}")
        
        if index_name in existing_indexes:
            print(f"✅ Index '{index_name}' already exists!")
            
            # Get index stats
            if host_url:
                index = pc.Index(index_name, host=host_url)
                print(f"🔗 Connected using host: {host_url}")
            else:
                index = pc.Index(index_name)
            
            try:
                stats = index.describe_index_stats()
                print(f"📈 Index stats: {stats.total_vector_count} vectors")
            except Exception as e:
                print(f"⚠️  Could not get index stats: {e}")
                print("💡 This might be due to missing host URL")
            
        else:
            print(f"🔨 Creating new index: {index_name}")
            
            # Create index
            pc.create_index(
                name=index_name,
                dimension=384,  # all-MiniLM-L6-v2 embedding dimension
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            
            print(f"✅ Index '{index_name}' created successfully!")
        
        print("\n🎉 Pinecone setup complete!")
        print("💡 You can now run the AI Tutor backend with: python run.py")
        
    except Exception as e:
        print(f"❌ Error setting up Pinecone: {e}")
        print("\n🔍 Troubleshooting:")
        print("1. Check your API key is correct")
        print("2. Ensure you have an active Pinecone account")
        print("3. Verify your internet connection")

if __name__ == "__main__":
    main() 