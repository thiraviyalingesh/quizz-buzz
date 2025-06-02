from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

app = FastAPI(title="Quiz Image Server", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the parent directory (where the image folders are located)
# parent_dir = Path(__file__).parent.parent
parent_dir = Path(__file__).parent.parent / "frontend"


# Mount static files for serving images
quiz_folders = [
    "NEET-2025-Code-48_extracted_images",
    # Add more quiz image folders here as needed
]

mounted_folders = []
for folder in quiz_folders:
    folder_path = parent_dir / folder
    if folder_path.exists():
        app.mount(f"/{folder}", StaticFiles(directory=str(folder_path)), name=folder.replace('-', '_'))
        mounted_folders.append(folder)
        print(f"✅ Mounted: /{folder} -> {folder_path}")
        
        # List files in the folder for debugging
        files = list(folder_path.glob("*"))
        print(f"   📁 Files found: {[f.name for f in files[:5]]}...")
    else:
        print(f"❌ Folder not found: {folder_path}")

@app.get("/")
def read_root():
    return {
        "message": "Quiz Image Server is running! 🚀",
        "mounted_folders": mounted_folders,
        "example_urls": [
            f"http://localhost:8000/{folder}/q3_diagram.png.png"
            for folder in mounted_folders
        ],
        "note": "Check file extensions - some files have .png.png"
    }

@app.get("/list/{folder_name}")
def list_files(folder_name: str):
    """List all files in a specific folder for debugging"""
    folder_path = parent_dir / folder_name
    if not folder_path.exists():
        return {"error": f"Folder {folder_name} not found"}
    
    files = [f.name for f in folder_path.iterdir() if f.is_file()]
    return {"folder": folder_name, "files": files}

@app.get("/health")
def health_check():
    return {"status": "healthy", "server": "Quiz Image Server"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Quiz Image Server...")
    print(f"📁 Working directory: {parent_dir}")
    uvicorn.run(app, host="0.0.0.0", port=8000)