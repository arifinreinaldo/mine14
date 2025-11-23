#!/bin/bash

echo "🍽️  Restaurant POS System - Quick Start"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Initialize database
echo "🗄️  Initializing database..."
docker-compose exec -T backend npm run init-db

# Generate QR codes
echo "🔲 Generating QR codes..."
sleep 2
curl -X POST http://localhost:3000/api/tables/generate-qr 2>/dev/null || echo "Note: You can generate QR codes from the admin panel"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 Access your Restaurant POS System:"
echo "   Main Dashboard:    http://localhost"
echo "   Kitchen Display:   http://localhost/kitchen"
echo "   Server Dashboard:  http://localhost/server"
echo "   Admin Panel:       http://localhost/admin"
echo ""
echo "🔍 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
echo ""
