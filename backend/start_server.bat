@echo off
echo 🚀 Starting Quiz Image Server...
echo.
echo 📦 Installing requirements...
pip install -r requirements.txt
echo.
echo 🌐 Starting server on http://localhost:8080
echo.
uvicorn main:app --host 0.0.0.0 --port 8080 --reload