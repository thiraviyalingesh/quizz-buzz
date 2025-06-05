#!/bin/bash

echo "🚀 Quiz Buzz - Single Container Deployment Script"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose found"

# Stop any existing containers
print_warning "Stopping any existing containers..."
docker-compose down

# Remove old images if they exist
print_warning "Cleaning up old images..."
docker-compose down --rmi all 2>/dev/null || true

# Build and start the application
print_status "Building and starting Quiz Buzz application..."
docker-compose up --build -d

# Wait a moment for the container to start
sleep 3

# Check if container is running
if docker-compose ps | grep -q "Up"; then
    print_status "Quiz Buzz is now running!"
    print_status "Access your application at: http://localhost:8080"
    echo ""
    echo "📝 Available endpoints:"
    echo "   • Frontend: http://localhost:8080"
    echo "   • API: http://localhost:8080/docs (FastAPI docs)"
    echo "   • Teacher Panel: http://localhost:8080 (click Teacher Panel)"
    echo ""
    echo "🔧 Useful commands:"
    echo "   • View logs: docker-compose logs -f"
    echo "   • Stop app: docker-compose down"
    echo "   • Restart: docker-compose restart"
else
    print_error "Failed to start the application. Check the logs:"
    docker-compose logs
    exit 1
fi

print_status "Deployment completed successfully!"