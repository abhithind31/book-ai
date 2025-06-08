# AI-Enhanced Personal Ebook Reader Setup Script
# This script helps you set up the project quickly

Write-Host "AI-Enhanced Personal Ebook Reader Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Docker is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker Compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    @"
# AI-Enhanced Personal Ebook Reader Environment Configuration

# Gemini API Key for AI explanations and dictionary
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_URL=postgresql://bookuser:bookpass@db:5432/bookreader

# Backend API URL (for frontend)
REACT_APP_API_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host ".env file created" -ForegroundColor Green
    Write-Host "Please edit .env and add your Gemini API key!" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
} else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

# Create necessary directories
Write-Host "Creating directories..." -ForegroundColor Yellow

$directories = @("models", "uploads")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created $dir directory" -ForegroundColor Green
    } else {
        Write-Host "$dir directory already exists" -ForegroundColor Green
    }
}

# Ask user if they want to start the application
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
$startApp = Read-Host "Would you like to start the application now? (y/N)"

if ($startApp -eq "y" -or $startApp -eq "Y") {
    Write-Host "Starting AI-Enhanced Personal Ebook Reader..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    
    try {
        docker-compose up -d
        
        Write-Host ""
        Write-Host "Application started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your ebook reader at:" -ForegroundColor Cyan
        Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
        Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
        Write-Host ""
        Write-Host "To check status: docker-compose ps" -ForegroundColor Yellow
        Write-Host "To view logs: docker-compose logs" -ForegroundColor Yellow
        Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
        
    } catch {
        Write-Host "Failed to start application. Check Docker and try again." -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "To start the application later, run:" -ForegroundColor Cyan
    Write-Host "   docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "Don't forget to:" -ForegroundColor Yellow
    Write-Host "   1. Add your Gemini API key to .env" -ForegroundColor White
    Write-Host "   2. Ensure NVIDIA drivers are installed (for GPU TTS)" -ForegroundColor White
}

Write-Host ""
Write-Host "Happy reading!" -ForegroundColor Magenta 