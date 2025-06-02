@echo off
echo 🚀 Starting Quiz Image Server...
echo.
echo 📦 Installing requirements...
pip install -r requirements.txt
echo.
echo 🌐 Starting server on http://localhost:8000
echo.
python main.py