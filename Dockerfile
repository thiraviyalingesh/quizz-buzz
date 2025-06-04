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

# Install system dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend static files
COPY --from=frontend-builder /app/frontend/build ./static

# Create necessary directories
RUN mkdir -p /app/data /app/quiz_data /app/images

# Set environment variables
ENV DATA_DIR=/app/data
ENV QUIZ_DIR=/app/quiz_data
ENV IMAGES_DIR=/app/images
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Create a startup script
RUN echo '#!/bin/bash\n\
echo "Starting Quiz Buzz Application..."\n\
echo "Data directory: $DATA_DIR"\n\
echo "Quiz directory: $QUIZ_DIR"\n\
echo "Images directory: $IMAGES_DIR"\n\
uvicorn main:app --host 0.0.0.0 --port 8000' > /app/start.sh

RUN chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]