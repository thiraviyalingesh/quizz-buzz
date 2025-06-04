# Quiz Buzz Docker Setup

This document explains how to run the Quiz Buzz application using Docker.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Build and run the application:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Open your browser and go to: `http://localhost:8000`

## Directory Structure

The application uses the following directory structure:

```
quizz-buzz/
├── data/                    # Student results storage (persistent)
├── quiz_data/              # Quiz JSON files
│   ├── JEE.json
│   └── NEET-2025-Code-48.json
├── images/                 # Quiz images
│   ├── q3_diagram.png
│   ├── q4_polaroid_diagram.png
│   └── ...
├── Dockerfile
├── docker-compose.yml
└── ...
```

## Configuration

The application can be configured using environment variables:

- `DATA_DIR`: Directory for student results (default: `/app/data`)
- `QUIZ_DIR`: Directory for quiz JSON files (default: `/app/quiz_data`)
- `IMAGES_DIR`: Directory for quiz images (default: `/app/images`)

## Adding New Quizzes

1. Place your quiz JSON files in the `quiz_data/` directory
2. Place associated images in the `images/` directory
3. Restart the application: `docker-compose restart`

## Data Persistence

- Student results are stored in the `data/` directory
- This directory is mounted as a volume, so data persists between container restarts

## Development vs Production

The application automatically falls back to the original file structure if the Docker directories are not found, making it compatible with both development and Docker environments.

## Stopping the Application

```bash
docker-compose down
```

## Rebuilding After Changes

```bash
docker-compose down
docker-compose up --build
```

## Troubleshooting

1. **Port already in use:**
   - Change the port in `docker-compose.yml` from `8000:8000` to `8001:8000` (or any other available port)

2. **Images not loading:**
   - Check that images are in the `images/` directory
   - Verify image paths in quiz JSON files match the filenames

3. **Quiz not found:**
   - Ensure quiz JSON files are in the `quiz_data/` directory
   - Check that the quiz name matches the filename (without .json extension)