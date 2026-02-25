#!/usr/bin/env python3
import uvicorn
import os
import sys

# Ensure the backend directory is in the path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

if __name__ == "__main__":
    print("🚀 Starting Skill Gap Intelligence System...")
    print("🌐 Access the app at: http://localhost:8000")
    
    # Run the uvicorn server
    # We point to main:app as main.py is inside the backend folder and we added it to sys.path
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
