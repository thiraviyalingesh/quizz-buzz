# Multi-stage build for the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Python backend stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (fixed the incomplete line)
RUN apt-get update && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# No start script needed - using uvicorn directly

# Copy built frontend static files
COPY --from=frontend-builder /app/frontend/build ./static

# Copy your actual data directories
COPY data/ /app/data/
COPY quiz_data/ /app/quiz_data/
COPY images/ /app/images/

# Copy environment variables
COPY .env /app/.env

# Set environment variables
ENV DATA_DIR=/app/data
ENV QUIZ_DIR=/app/quiz_data
ENV IMAGES_DIR=/app/images
ENV PYTHONPATH=/app

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the application directly with uvicorn, using PORT env var
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]