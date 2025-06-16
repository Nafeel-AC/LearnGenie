#!/bin/bash

echo "Starting AI Tutor RAG Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Please install pip."
    exit 1
fi

# Install requirements
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your API keys before running the server."
    echo "You need:"
    echo "- GEMINI_API_KEY (Google AI API key)"
    echo "- PINECONE_API_KEY (Pinecone vector database key)" 
    echo "- PINECONE_ENVIRONMENT (Pinecone environment)"
    echo "After setting up your .env file, run: python3 run.py"
    exit 0
fi

# Start the server
echo "Starting FastAPI server..."
python3 run.py 