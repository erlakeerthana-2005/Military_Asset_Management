# Database Setup Script for Military Asset Management System
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Database Setup for Military Asset Management         " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Database configuration
$DB_NAME = "military_asset_db"
$DB_USER = "postgres"
$SCHEMA_FILE = "database\schema.sql"

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Create the database: $DB_NAME" -ForegroundColor White
Write-Host "  2. Load the schema from: $SCHEMA_FILE" -ForegroundColor White
Write-Host "  3. Insert sample data (bases, users, equipment)" -ForegroundColor White
Write-Host ""

# Check if PostgreSQL is installed
try {
    $psqlVersion = psql --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL not found"
    }
    Write-Host "✓ PostgreSQL found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL 12+ or add it to your PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Step 1: Database Creation                            " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$dbPassword = Read-Host "Enter PostgreSQL password for user '$DB_USER'" -AsSecureString
$PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
$env:PGPASSWORD = $PGPASSWORD

# Check if database exists
Write-Host "Checking if database exists..." -ForegroundColor Yellow
$dbExists = psql -U $DB_USER -lqt 2>&1 | Select-String -Pattern $DB_NAME -Quiet

if ($dbExists) {
    Write-Host "⚠ Database '$DB_NAME' already exists" -ForegroundColor Yellow
    $recreate = Read-Host "Do you want to drop and recreate it? (y/n)"
    
    if ($recreate -eq "y") {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        psql -U $DB_USER -c "DROP DATABASE $DB_NAME;" 2>&1
        
        Write-Host "Creating new database..." -ForegroundColor Yellow
        psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database created successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to create database" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "Creating database..." -ForegroundColor Yellow
    psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create database" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Step 2: Schema Loading                               " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $SCHEMA_FILE) {
    Write-Host "Loading schema from $SCHEMA_FILE..." -ForegroundColor Yellow
    psql -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema loaded successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to load schema" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Schema file not found: $SCHEMA_FILE" -ForegroundColor Red
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Database Setup Complete!                             " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $DB_NAME" -ForegroundColor Green
Write-Host "Sample Data Loaded:" -ForegroundColor Green
Write-Host "  • 4 Bases" -ForegroundColor White
Write-Host "  • 6 Users (admin, commanders, logistics)" -ForegroundColor White
Write-Host "  • 10 Equipment Types" -ForegroundColor White
Write-Host "  • 40 Inventory Records" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Login:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "You can now start the application with: .\start.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
