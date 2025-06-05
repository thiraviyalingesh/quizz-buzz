# Quiz Buzz - Single Container Deployment Guide

## 🐛 Issues Fixed

### 1. **Frontend-Backend Sync Issue** ✅ FIXED
- **Problem**: Frontend was hardcoded to use `http://localhost:8000` which doesn't work in deployed environments
- **Solution**: Changed all API calls to use `window.location.origin` for dynamic URL resolution

### 2. **Static File Serving** ✅ FIXED  
- **Problem**: Backend wasn't serving React frontend files
- **Solution**: Added static file mounting and catch-all route to serve React app

### 3. **API Route Conflicts** ✅ FIXED
- **Problem**: React router conflicting with backend API routes
- **Solution**: Added proper route handling to distinguish between API calls and React routes

## 🚀 Quick Deployment

### Option 1: Using the Deployment Script (Recommended)
```bash
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# Stop any existing containers
docker-compose down

# Build and start
docker-compose up --build

# Access at http://localhost:8000
```

## 🔧 Architecture Overview

```
Single Container (Port 8000)
├── FastAPI Backend
│   ├── API endpoints (/quiz/*, /teacher/*)
│   ├── Static files (/static/*, /quiz_data/*, /images/*)
│   └── React app serving (all other routes)
└── React Frontend (built files served by FastAPI)
```

## 📁 Directory Structure in Container

```
/app/
├── main.py                 # FastAPI backend
├── static/                 # React build files
├── data/                   # Student results (persistent)
├── quiz_data/             # Quiz JSON files
└── images/                # Quiz images
```

## 🔍 Troubleshooting

### Issue: "React app not found"
**Solution**: Ensure the frontend builds successfully
```bash
docker-compose logs quiz-app | grep "React"
```

### Issue: API calls fail (404/CORS errors)
**Solution**: Check that backend is running
```bash
curl http://localhost:8000/teacher/results
```

### Issue: Images not loading
**Solution**: Verify image directory mounting
```bash
docker-compose exec quiz-app ls -la /app/images/
```

### Issue: Quiz data not found
**Solution**: Check quiz files are mounted
```bash
docker-compose exec quiz-app ls -la /app/quiz_data/
```

## 📊 Monitoring

### View real-time logs:
```bash
docker-compose logs -f
```

### Check container status:
```bash
docker-compose ps
```

### Access container shell:
```bash
docker-compose exec quiz-app bash
```

## 🔄 Updates and Maintenance

### Update application:
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build
```

### Backup data:
```bash
# Backup student results
cp data/student_results.json backup_$(date +%Y%m%d).json
```

## 🌐 Production Deployment

For production, consider:

1. **Environment Variables**:
   ```yaml
   environment:
     - PYTHONPATH=/app
     - DATA_DIR=/app/data
     - QUIZ_DIR=/app/quiz_data
     - IMAGES_DIR=/app/images
   ```

2. **Volume Persistence**:
   - Ensure `./data` is properly backed up
   - Consider using named volumes for production

3. **Port Configuration**:
   - Change port in `docker-compose.yml` if 8000 is occupied
   - Update firewall rules if needed

4. **SSL/HTTPS**:
   - Add reverse proxy (nginx) for SSL termination
   - Update CORS settings if needed

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify all directories exist: `./data`, `./quiz_data`, `./images`
3. Ensure Docker has proper permissions
4. Check if port 8000 is available

## ✅ Success Indicators

When deployment is successful, you should see:
- ✅ React build completed
- ✅ FastAPI server starting
- ✅ Static files mounted
- ✅ Database files loaded
- 🌐 Application accessible at http://localhost:8000