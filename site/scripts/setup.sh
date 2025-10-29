#!/bin/bash

# PinReddit Initial Setup Script

echo "🚀 PinReddit Setup Script"
echo "========================"

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo ""
echo "Checking dependencies..."
check_command node
check_command npm
check_command redis-cli
check_command psql
check_command ffmpeg
check_command yt-dlp

echo ""
echo "Creating directories..."
mkdir -p media temp logs
echo "✅ Directories created"

echo ""
echo "Setting up environment file..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env with your configuration values"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"

echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Create PostgreSQL database: createdb pinreddit"
echo "3. Run database migrations: npm run db:push"
echo "4. Start Redis server: redis-server"
echo "5. Start development: npm run dev (in one terminal)"
echo "6. Start worker: npm run worker:dev (in another terminal)"
echo ""
echo "Access the application at http://localhost:3002"
echo "Access the admin panel at http://localhost:3002/admin"
