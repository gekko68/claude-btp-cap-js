# Usage Guide and Operational Procedures

## Purpose
This document provides comprehensive instructions for running, using, and interacting with the SAP BTP CAP Bookshop application. It covers everything from initial setup to advanced usage patterns, serving as a practical guide for developers, operators, and users.

## Quick Start Guide

### Prerequisites
Before starting, ensure you have the required tools and environment setup:

**Required Tools**:
- **Node.js 18+**: JavaScript runtime environment
- **npm**: Package manager (comes with Node.js)
- **SAP CDS CLI**: CAP development toolkit
- **Git**: Version control system

**Installation Commands**:
```bash
# Install SAP CDS development kit globally
npm install -g @sap/cds-dk

# Verify installations
node --version        # Should be 18.x or higher
npm --version         # Latest stable version
cds --version         # Should be 9.x or higher
```

### Initial Setup

**1. Clone and Install Dependencies**:
```bash
# Clone the repository
git clone <repository-url>
cd claude-btp-cap-js

# Install project dependencies
npm install

# Verify installation
npm run serve         # Should start the development server
```

**2. Database Initialization**:
```bash
# Deploy database schema with sample data
npm run deploy:sqlite

# Verify database setup
ls -la bookshop.db    # Should show SQLite database file
```

**3. Start Development Server**:
```bash
# Start server with hot-reload
npm run dev

# Alternative: Start server without hot-reload
npm run serve
```

**Expected Output**:
```
🚀 Available endpoints:
📚 Books: GET http://localhost:4004/bookshop/Books
🔧 Create Book: POST http://localhost:4004/bookshop/createBook
📖 Metadata: GET http://localhost:4004/bookshop/$metadata
```

## Development Workflow and Common Commands

### Core Development Commands

**Project Management**:
```bash
# Start development with hot-reload
npm run dev                    # Watch mode with auto-restart

# Start production server
npm start                      # Production mode

# Serve specific services
cds serve srv                  # Serve only srv directory
cds serve --port 4005         # Custom port
```

**Database Operations**:
```bash
# Deploy to SQLite (development)
npm run deploy:sqlite          # Local SQLite database

# Deploy to HANA (production)
npm run deploy:hana           # Requires HANA Cloud setup

# Reset database
rm bookshop.db                # Remove SQLite file
npm run deploy:sqlite         # Recreate with fresh data
```

**Build and Production**:
```bash
# Build for production
npm run build                 # Compile CDS models

# Build production artifacts
npm run build:production      # Optimized production build

# Build MTA archive
npm run build:mta            # Create deployable archive
```

### Development Environment Configuration

**Environment Variables**:
```bash
# Development environment
export CDS_ENV=development
export DEBUG=bookshop-service,server
export NODE_ENV=development

# Custom database location
export CDS_DB_URL=sqlite:./custom-bookshop.db

# Custom port
export PORT=4005
```

**Configuration Files**:
- `package.json`: CDS configuration and dependencies
- `.env.local`: Local environment variables (not committed)
- `CLAUDE.md`: Project documentation and best practices

## API Usage Examples and Integration Patterns

### REST API Endpoints

**Base URL**: `http://localhost:4004/bookshop`

### Standard CRUD Operations

**1. Get All Books**:
```bash
# Basic request
curl "http://localhost:4004/bookshop/Books"

# With OData query parameters
curl "http://localhost:4004/bookshop/Books?\$top=5&\$orderby=title"

# Filter by genre
curl "http://localhost:4004/bookshop/Books?\$filter=genre eq 'Fantasy'"

# Select specific fields
curl "http://localhost:4004/bookshop/Books?\$select=title,author,price"
```

**Expected Response**:
```json
{
  "@odata.context": "$metadata#Books",
  "value": [
    {
      "ID": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "genre": "Romance",
      "price": 12.99,
      "stock": 25,
      "description": "A romantic novel of manners",
      "publishedAt": "1813-01-28"
    }
  ]
}
```

**2. Get Single Book**:
```bash
# Get book by ID
curl "http://localhost:4004/bookshop/Books(123e4567-e89b-12d3-a456-426614174000)"

# Get book with related data (if associations exist)
curl "http://localhost:4004/bookshop/Books(123e4567-e89b-12d3-a456-426614174000)?\$expand=reviews"
```

**3. Create New Book (Standard POST)**:
```bash
curl -X POST "http://localhost:4004/bookshop/Books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Book Title",
    "author": "Author Name",
    "genre": "Fiction",
    "price": 19.99,
    "stock": 10,
    "description": "Book description",
    "publishedAt": "2024-01-15"
  }'
```

### Custom Business Operations

**1. Create Book Action (Custom Logic)**:
```bash
# Using custom createBook action
curl -X POST "http://localhost:4004/bookshop/createBook" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced CAP Development",
    "author": "SAP Expert",
    "genre": "Technical",
    "price": 49.99,
    "stock": 5
  }'
```

**Expected Response**:
```json
{
  "@odata.context": "$metadata#Books/$entity",
  "ID": "new-book-id-uuid",
  "title": "Advanced CAP Development",
  "author": "SAP Expert",
  "genre": "Technical",
  "price": 49.99,
  "stock": 5,
  "createdAt": "2024-01-15T10:30:45.123Z",
  "createdBy": "system"
}
```

**2. Get Books by Genre Function**:
```bash
# Using custom getBooksByGenre function
curl -X POST "http://localhost:4004/bookshop/getBooksByGenre" \
  -H "Content-Type: application/json" \
  -d '{"genre": "Fantasy"}'
```

**Expected Response**:
```json
{
  "@odata.context": "$metadata#Collection(bookshop.Books)",
  "value": [
    {
      "ID": "fantasy-book-1-id",
      "title": "Harry Potter and the Philosopher's Stone",
      "author": "J.K. Rowling",
      "genre": "Fantasy",
      "price": 9.99,
      "stock": 50
    },
    {
      "ID": "fantasy-book-2-id", 
      "title": "Lord of the Rings",
      "author": "J.R.R. Tolkien",
      "genre": "Fantasy",
      "price": 19.99,
      "stock": 22
    }
  ]
}
```

### OData Protocol Features

**Advanced Query Operations**:
```bash
# Pagination
curl "http://localhost:4004/bookshop/Books?\$skip=10&\$top=5"

# Sorting
curl "http://localhost:4004/bookshop/Books?\$orderby=price desc"

# Filtering with multiple conditions
curl "http://localhost:4004/bookshop/Books?\$filter=price gt 15 and genre eq 'Fiction'"

# Count total records
curl "http://localhost:4004/bookshop/Books?\$count=true"

# Search across text fields
curl "http://localhost:4004/bookshop/Books?\$search=tolkien"
```

## Configuration Options and Customization

### Database Configuration

**Development Configuration** (package.json):
```json
{
  "cds": {
    "requires": {
      "db": {
        "[development]": {
          "kind": "sqlite",
          "credentials": {
            "url": "bookshop.db"
          }
        }
      }
    }
  }
}
```

**Production Configuration**:
```json
{
  "cds": {
    "requires": {
      "db": {
        "[production]": {
          "kind": "hana"
        }
      },
      "[production]": {
        "auth": "xsuaa"
      }
    }
  }
}
```

### Logging Configuration

**Development Logging**:
```json
{
  "cds": {
    "log": {
      "levels": {
        "bookshop-service": "debug",
        "server": "info",
        "db": "warn"
      }
    }
  }
}
```

**Production Logging**:
```json
{
  "cds": {
    "log": {
      "levels": {
        "bookshop-service": "info",
        "server": "info",
        "db": "error"
      }
    }
  }
}
```

### Service Customization

**Custom Middleware Integration**:
```javascript
// In server.js or service implementation
cds.on('bootstrap', (app) => {
  // Add custom middleware
  app.use('/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
  });
  
  // Add request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
});
```

## Common Use Cases and Workflow Examples

### Use Case 1: Book Inventory Management

**Scenario**: Add new books to inventory and update stock levels

**Workflow**:
```bash
# 1. Add new book
curl -X POST "http://localhost:4004/bookshop/createBook" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "genre": "Technical",
    "price": 39.99,
    "stock": 15
  }'

# 2. Check current inventory
curl "http://localhost:4004/bookshop/Books?\$filter=stock lt 10"

# 3. Update stock (using PATCH)
curl -X PATCH "http://localhost:4004/bookshop/Books(book-id)" \
  -H "Content-Type: application/json" \
  -d '{"stock": 25}'
```

### Use Case 2: Book Catalog Search

**Scenario**: Customer searching for books by various criteria

**Workflow**:
```bash
# Search by author
curl "http://localhost:4004/bookshop/Books?\$filter=contains(author,'Tolkien')"

# Search by price range
curl "http://localhost:4004/bookshop/Books?\$filter=price ge 10 and price le 20"

# Search by genre with sorting
curl "http://localhost:4004/bookshop/Books?\$filter=genre eq 'Fiction'&\$orderby=title"

# Full-text search
curl "http://localhost:4004/bookshop/Books?\$search=wizard magic"
```

### Use Case 3: Reporting and Analytics

**Scenario**: Generate reports on book inventory and sales

**Workflow**:
```bash
# Books by genre count
curl "http://localhost:4004/bookshop/Books?\$apply=groupby((genre),aggregate(\$count as count))"

# Average price by genre
curl "http://localhost:4004/bookshop/Books?\$apply=groupby((genre),aggregate(price with average as avgPrice))"

# Low stock alert
curl "http://localhost:4004/bookshop/Books?\$filter=stock lt 5&\$select=title,stock"
```

## Authentication and Authorization Usage

### Development Environment (No Auth)
In development mode, all endpoints are accessible without authentication.

### Production Environment (XSUAA)
**Authentication Required**: OAuth 2.0 tokens via XSUAA service

**Getting Access Token**:
```bash
# Get OAuth token (replace with actual values)
curl -X POST "https://your-subdomain.authentication.region.hana.ondemand.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=your-client-id&client_secret=your-client-secret"
```

**Using Access Token**:
```bash
# Include token in requests
curl "http://your-app-url/bookshop/Books" \
  -H "Authorization: Bearer your-access-token"
```

### Role-Based Access
**Admin Role**: Full CRUD operations on all entities
**User Role**: Read operations and limited create operations

## Performance Optimization Tips

### Database Query Optimization
```bash
# Use projections to limit data transfer
curl "http://localhost:4004/bookshop/Books?\$select=title,price"

# Use filtering to reduce result sets
curl "http://localhost:4004/bookshop/Books?\$filter=genre eq 'Fiction'"

# Use pagination for large datasets
curl "http://localhost:4004/bookshop/Books?\$top=20&\$skip=40"
```

### Caching Strategies
**Client-Side Caching**: Implement HTTP caching headers
**Server-Side Caching**: Use Redis for frequently accessed data
**Database Caching**: Leverage HANA's in-memory capabilities

### Load Testing
```bash
# Use tools like Apache Bench for load testing
ab -n 1000 -c 10 "http://localhost:4004/bookshop/Books"

# Monitor response times and error rates
curl -w "@curl-format.txt" "http://localhost:4004/bookshop/Books"
```

## Troubleshooting Common Issues

### Server Won't Start
**Check**:
1. Port availability: `lsof -i :4004`
2. Node.js version: `node --version`
3. Dependencies: `npm install`
4. Database file: `ls -la bookshop.db`

### Database Connection Issues
**Solutions**:
```bash
# Recreate database
rm bookshop.db
npm run deploy:sqlite

# Check database schema
sqlite3 bookshop.db ".schema"

# Verify data
sqlite3 bookshop.db "SELECT * FROM bookshop_Books LIMIT 5;"
```

### API Response Issues
**Debug Steps**:
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check service metadata
curl "http://localhost:4004/bookshop/\$metadata"

# Validate JSON payload
echo '{"title":"test"}' | jq .
```

This comprehensive usage guide provides practical examples and workflows for effectively using and operating the SAP BTP CAP Bookshop application across development, testing, and production environments.