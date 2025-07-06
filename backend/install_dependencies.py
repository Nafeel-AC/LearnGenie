#!/usr/bin/env python3
"""
Installation script for AI Tutor multiformat support and web scraping dependencies.
Run this script to install all required packages for the enhanced backend.
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {description} failed")
        print(f"Command: {command}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is adequate"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def install_dependencies():
    """Install all required dependencies"""
    print("🚀 Installing AI Tutor Enhanced Dependencies")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Update pip
    if not run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip"):
        return False
    
    # Install core dependencies (latest versions)
    dependencies = [
        # Core FastAPI and server
        "fastapi",
        "uvicorn",
        "python-multipart",
        "python-dotenv",
        
        # RAG and AI
        "langchain",
        "langchain-google-genai",
        "langchain-community",
        "sentence-transformers",
        "pinecone-client",
        
        # Database
        "supabase",
        "psycopg2-binary",
        
        # Document processing
        "PyPDF2",
        "python-docx",
        "openpyxl",
        "xlrd",
        "python-pptx",
        "markdown",
        
        # Web scraping
        "requests",
        "firecrawl-py",
        
        # Image processing (OCR)
        "Pillow",
        "pytesseract",
        "opencv-python",
        
        # Audio processing
        "SpeechRecognition",
        "pydub",
        
        # Utilities
        "pydantic",
        "aiofiles",
        "python-magic-bin",  # Windows-compatible version
        "chardet",
        "validators"
    ]
    
    # Install in batches to avoid conflicts
    batch_size = 8
    batches = []
    
    # Create batches dynamically based on actual dependency count
    for i in range(0, len(dependencies), batch_size):
        batch = dependencies[i:i + batch_size]
        if batch:  # Only add non-empty batches
            batches.append(batch)
    
    for i, batch in enumerate(batches, 1):
        if batch:  # Double check batch is not empty
        batch_cmd = f"{sys.executable} -m pip install " + " ".join(batch)
        if not run_command(batch_cmd, f"Installing dependency batch {i}/{len(batches)}"):
            print(f"⚠️  Some dependencies in batch {i} failed to install")
            continue
    
    return True

def verify_installation():
    """Verify that key packages are installed"""
    print("\n🔍 Verifying installation...")
    
    critical_packages = [
        'fastapi', 'uvicorn', 'langchain', 'supabase', 'requests', 
        'firecrawl', 'PIL', 'docx', 'openpyxl'
    ]
    
    failed_packages = []
    
    for package in critical_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package}")
            failed_packages.append(package)
    
    if failed_packages:
        print(f"\n⚠️  The following critical packages failed to install: {', '.join(failed_packages)}")
        print("You may need to install them manually or check for system dependencies.")
        return False
    
    print("\n🎉 All critical packages verified successfully!")
    return True

def print_optional_dependencies():
    """Print information about optional dependencies"""
    print("\n📋 Optional Dependencies:")
    print("=" * 30)
    print("For better functionality, consider installing these system dependencies:")
    print("\n🖼️  For OCR (Image text extraction):")
    print("   - Linux: sudo apt-get install tesseract-ocr")
    print("   - macOS: brew install tesseract")
    print("   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
    
    print("\n🎵 For Audio processing:")
    print("   - Linux: sudo apt-get install ffmpeg")
    print("   - macOS: brew install ffmpeg") 
    print("   - Windows: Download from https://ffmpeg.org/download.html")
    
    print("\n🔍 For advanced file type detection:")
    print("   - Linux: sudo apt-get install libmagic1")
    print("   - macOS: brew install libmagic")
    print("   - Windows: Install python-magic-bin instead of python-magic")

def main():
    """Main installation function"""
    print("🎯 AI Tutor Enhanced Backend Installation")
    print("This script will install support for:")
    print("  📄 Multiple document formats (PDF, Word, Excel, PowerPoint)")
    print("  🌐 Web scraping capabilities")
    print("  🖼️  Image text extraction (OCR)")
    print("  🎵 Audio transcription")
    print("  📚 Enhanced AI tutoring features")
    
    response = input("\nDo you want to continue? (y/N): ").lower().strip()
    if response not in ['y', 'yes']:
        print("Installation cancelled.")
        return
    
    # Install dependencies
    if install_dependencies():
        # Verify installation
        if verify_installation():
            print("\n🎉 Installation completed successfully!")
            print("\n🚀 Next steps:")
            print("1. Update your .env file with new API keys")
            print("2. Run: python main.py")
            print("3. Test multiformat uploads and web scraping")
        else:
            print("\n⚠️  Installation completed with some issues")
    else:
        print("\n❌ Installation failed")
        return
    
    # Print optional dependencies info
    print_optional_dependencies()

if __name__ == "__main__":
    main() 