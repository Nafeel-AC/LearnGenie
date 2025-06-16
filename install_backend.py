#!/usr/bin/env python3
"""
AI Tutor Backend Installation Script
This script sets up the Python backend for the AI Tutor RAG system.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during {description}")
        print(f"Command: {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🤖 AI Tutor Backend Setup")
    print("=" * 50)
    
    # Check Python version
    python_version = sys.version_info
    if python_version < (3, 8):
        print(f"❌ Python 3.8+ required. Current version: {python_version.major}.{python_version.minor}")
        sys.exit(1)
    
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro} detected")
    
    # Create backend directory if it doesn't exist
    backend_dir = Path("backend")
    backend_dir.mkdir(exist_ok=True)
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Install basic requirements first
    basic_requirements = [
        "fastapi",
        "uvicorn", 
        "python-multipart",
        "PyPDF2",
        "python-dotenv",
        "pydantic"
    ]
    
    print("\n📦 Installing basic requirements...")
    for package in basic_requirements:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            print(f"⚠️  Failed to install {package}, continuing...")
    
    # Optional AI/ML requirements (these might fail on some systems)
    ai_requirements = [
        "langchain",
        "langchain-google-genai",
        "sentence-transformers", 
        "tiktoken"
    ]
    
    print("\n🤖 Installing AI/ML requirements...")
    for package in ai_requirements:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            print(f"⚠️  {package} installation failed - you may need to install this manually")
    
    # Create .env file if it doesn't exist
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        print("\n📝 Creating .env file from template...")
        env_file.write_text(env_example.read_text())
        print("✅ .env file created")
        print("\n⚠️  IMPORTANT: Edit the .env file with your API keys before running the server!")
        print("Required API keys:")
        print("- GEMINI_API_KEY (Get from: https://makersuite.google.com/)")
        print("- PINECONE_API_KEY (Get from: https://www.pinecone.io/)")
        print("- PINECONE_ENVIRONMENT (From your Pinecone dashboard)")
    
    print("\n🚀 Backend setup completed!")
    print("\nNext steps:")
    print("1. Edit backend/.env with your API keys")
    print("2. Run: cd backend && python run.py")
    print("3. Backend will be available at http://localhost:8000")

if __name__ == "__main__":
    main() 