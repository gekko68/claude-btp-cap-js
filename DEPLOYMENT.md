# Deployment and Operational Procedures

## Purpose
This document provides comprehensive guidance for deploying and operating the SAP BTP CAP Bookshop application across different environments. It covers local development, staging, and production deployment procedures, along with operational best practices for maintaining the application in production.

## Environment Setup and Requirements

### Development Environment
**Local Development Setup**:
- **Node.js**: Version 18.x or higher
- **SAP CDS CLI**: Latest version (`npm install -g @sap/cds-dk`)
- **SQLite**: For local database development
- **Git**: For version control
- **VS Code**: Recommended IDE with SAP CDS extension

**Environment Configuration**:
```bash
# Development environment variables
export NODE_ENV=development
export CDS_ENV=development
export DEBUG=bookshop-service,server
export PORT=4004
```

### Staging Environment (SAP BTP)
**Required Services**:
- **Cloud Foundry Space**: Staging environment space
- **HANA Cloud**: Database service instance
- **XSUAA**: Authentication service
- **Application Logging**: Log aggregation service

**Service Planning**:
- **CF Memory**: 512MB for staging workloads
- **HANA**: Shared instance for staging
- **Log Retention**: 7 days for staging environment

### Production Environment (SAP BTP)
**Required Services**:
- **Cloud Foundry Space**: Production environment space
- **HANA Cloud**: Dedicated production database instance
- **XSUAA**: Production authentication service
- **Application Logging**: Production log aggregation
- **Application Autoscaler**: For production scaling

**Service Planning**:
- **CF Memory**: 1GB+ for production workloads
- **HANA**: Dedicated instance with backup strategy
- **Log Retention**: 30+ days for compliance
- **Backup Strategy**: Daily automated backups

## Deployment Procedures and Automation

### Multi-Target Application (MTA) Deployment

**MTA Descriptor Overview**:
The `mta.yaml` file defines the complete application structure:

```yaml
# Key components from mta.yaml
modules:
  - name: bookshop-cap-sample-srv      # Node.js service module
    type: nodejs
    path: gen/srv
    
  - name: bookshop-cap-sample-db-deployer  # Database deployment module
    type: hdb
    path: gen/db

resources:
  - name: bookshop-cap-sample-auth     # XSUAA authentication
    type: org.cloudfoundry.managed-service
    
  - name: bookshop-cap-sample-db       # HANA database service
    type: org.cloudfoundry.managed-service
    
  - name: bookshop-cap-sample-logging  # Application logging
    type: org.cloudfoundry.managed-service
```

### Step-by-Step Deployment Process

**1. Pre-Deployment Preparation**:
```bash
# Ensure you're in the project root directory
cd /path/to/bookshop-cap-sample

# Install dependencies
npm install

# Build the application for production
npm run build:production

# Verify build artifacts
ls -la gen/         # Should contain srv/ and db/ directories
```

**2. MTA Archive Creation**:
```bash
# Build MTA archive
npm run build:mta

# Verify MTA archive creation
ls -la mta_archives/
# Should show: bookshop-cap-sample_1.0.0.mtar
```

**3. Cloud Foundry Login and Target**:
```bash
# Login to Cloud Foundry
cf login -a https://api.cf.region.hana.ondemand.com

# Target your organization and space
cf target -o your-org -s your-space

# Verify target
cf target
```

**4. Deploy to Cloud Foundry**:
```bash
# Deploy using npm script
npm run deploy:cf

# Alternative: Deploy directly with cf
cf deploy mta_archives/bookshop-cap-sample_1.0.0.mtar

# Monitor deployment progress
cf logs bookshop-cap-sample-srv --recent
```

**5. Post-Deployment Verification**:
```bash
# Check application status
cf apps

# Check service bindings
cf services

# Test application endpoints
curl "https://your-app-url/bookshop/Books"
```

### Automated Deployment Pipeline

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to SAP BTP
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build:production
        
      - name: Build MTA archive
        run: npm run build:mta
        
      - name: Deploy to Cloud Foundry
        env:
          CF_API: ${{ secrets.CF_API }}
          CF_USER: ${{ secrets.CF_USER }}
          CF_PASSWORD: ${{ secrets.CF_PASSWORD }}
          CF_ORG: ${{ secrets.CF_ORG }}
          CF_SPACE: ${{ secrets.CF_SPACE }}
        run: |
          cf login -a $CF_API -u $CF_USER -p $CF_PASSWORD -o $CF_ORG -s $CF_SPACE
          npm run deploy:cf
```

## Configuration Management and Environment Variables

### Environment-Specific Configuration

**Development Configuration**:
```json
// package.json - Development profile
{
  "cds": {
    "requires": {
      "db": {
        "[development]": {
          "kind": "sqlite",
          "credentials": { "url": "bookshop.db" }
        }
      }
    },
    "log": {
      "levels": {
        "bookshop-service": "debug",
        "server": "info"
      }
    }
  }
}
```

**Production Configuration**:
```json
// package.json - Production profile
{
  "cds": {
    "requires": {
      "db": {
        "[production]": { "kind": "hana" }
      },
      "[production]": {
        "auth": "xsuaa"
      }
    },
    "log": {
      "levels": {
        "bookshop-service": "info",
        "server": "info"
      }
    }
  }
}
```

### Service Binding Management

**Automatic Service Binding**: Cloud Foundry automatically injects service credentials as environment variables

**Manual Service Binding Verification**:
```bash
# Check service bindings for the application
cf env bookshop-cap-sample-srv

# Check specific service credentials
cf service-key bookshop-cap-sample-db production-key
```

**Service Binding in Code**:
```javascript
// Automatic service binding through CAP framework
// No manual configuration required in production
const cds = require('@sap/cds');

// CAP automatically uses bound services based on profile
// Development: Uses SQLite from package.json
// Production: Uses bound HANA service
```

## Database Setup and Migration Procedures

### Development Database Setup
```bash
# Initialize SQLite database with schema and data
npm run deploy:sqlite

# Verify database creation
ls -la bookshop.db

# Check database content
sqlite3 bookshop.db "SELECT count(*) FROM bookshop_Books;"
```

### Production Database Deployment

**Database Artifacts Structure**:
```
gen/db/
├── src/
│   └── gen/
│       ├── bookshop.Books.hdbtable      # Table definitions
│       ├── data/
│       │   └── bookshop-Books.hdbtabledata  # Initial data
│       └── BookshopService.Books.hdbview     # View definitions
└── package.json                          # DB module dependencies
```

**Database Deployment Process**:
1. **Schema Deployment**: Handled by `bookshop-cap-sample-db-deployer` module
2. **Data Seeding**: Initial data loaded from CSV files
3. **Version Management**: Handled through MTA deployment versioning

### Database Migration Strategy

**Schema Changes**:
```bash
# For development
rm bookshop.db                # Remove existing database
npm run deploy:sqlite         # Recreate with new schema

# For production
# Schema changes deployed through MTA upgrade
cf deploy mta_archives/bookshop-cap-sample_1.1.0.mtar
```

**Data Migration**:
- **Backward Compatible Changes**: Deployed seamlessly
- **Breaking Changes**: Require maintenance windows and data backup
- **Data Preservation**: HANA Cloud automated backup before deployment

## Monitoring and Health Check Setup

### Application Health Checks

**Built-in Health Endpoint**:
```javascript
// server.js - Health check implementation
server.on('bootstrap', (app) => {
  app.get('/health', (req, res) => {
    const healthStatus = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'UP',
        auth: 'UP'
      }
    };
    res.json(healthStatus);
  });
});
```

**Cloud Foundry Health Check**:
```bash
# Check application health
cf app bookshop-cap-sample-srv

# View application logs
cf logs bookshop-cap-sample-srv --recent

# Stream live logs
cf logs bookshop-cap-sample-srv
```

### Monitoring Integration

**SAP BTP Application Logging**:
- **Automatic Integration**: Logs automatically forwarded to Application Logging service
- **Structured Logging**: JSON format for automated processing
- **Log Retention**: Configurable based on service plan

**Custom Metrics (Future Enhancement)**:
```javascript
// Example: Custom metrics integration
const prometheus = require('prom-client');

const requestDuration = new prometheus.Histogram({
  name: 'bookshop_request_duration_seconds',
  help: 'Duration of bookshop requests in seconds',
  labelNames: ['method', 'route', 'status']
});

// Integrate with Express middleware
app.use((req, res, next) => {
  const end = requestDuration.startTimer({
    method: req.method,
    route: req.route?.path || req.path
  });
  
  res.on('finish', () => {
    end({ status: res.statusCode });
  });
  
  next();
});
```

## Backup and Recovery Procedures

### Database Backup Strategy

**HANA Cloud Automated Backups**:
- **Daily Backups**: Automatic daily backups with 30-day retention
- **Point-in-Time Recovery**: Recovery to any point within retention period
- **Cross-Region Backup**: For disaster recovery scenarios

**Manual Backup Procedures**:
```bash
# Export data for development/testing
# From HANA Cloud instance using HANA Studio or SQL commands

# Example: Export specific table data
SELECT * FROM "BOOKSHOP_BOOKS" 
INTO OUTFILE '/backup/books_backup_2024-01-15.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Application Code Backup
**Git Repository**: Primary source of truth for application code
**Deployment Artifacts**: MTA archives stored in artifact repository
**Configuration Management**: Environment-specific configurations in secure storage

### Disaster Recovery Plan

**Recovery Time Objective (RTO)**: 4 hours for production restoration
**Recovery Point Objective (RPO)**: 1 hour maximum data loss

**Recovery Procedures**:
1. **Assessment**: Determine scope of outage and root cause
2. **Database Recovery**: Restore from HANA Cloud backup
3. **Application Deployment**: Deploy latest known good MTA archive
4. **Service Verification**: Test all endpoints and integrations
5. **User Communication**: Notify stakeholders of service restoration

## Scaling and Performance Optimization

### Horizontal Scaling
```bash
# Scale application instances
cf scale bookshop-cap-sample-srv -i 3

# Check scaling status
cf app bookshop-cap-sample-srv
```

**Application Autoscaler Configuration**:
```json
{
  "instance_min_count": 1,
  "instance_max_count": 5,
  "scaling_rules": [
    {
      "metric_type": "memoryused",
      "threshold": 80,
      "operator": ">",
      "adjustment": "+1"
    },
    {
      "metric_type": "cpu",
      "threshold": 75,
      "operator": ">", 
      "adjustment": "+1"
    }
  ]
}
```

### Database Performance Optimization

**HANA Cloud Optimization**:
- **Connection Pooling**: Configured through CAP framework
- **Query Optimization**: Leverage HANA's columnar storage
- **Index Strategy**: Automatic index optimization in HANA

**Performance Monitoring**:
```bash
# Monitor application performance
cf app bookshop-cap-sample-srv

# Check memory and CPU usage
cf events bookshop-cap-sample-srv
```

## Security Considerations and Hardening

### Application Security
**HTTPS Enforcement**: Automatic in Cloud Foundry environment
**Authentication**: OAuth 2.0 via XSUAA service
**Authorization**: Role-based access control
**Input Validation**: Automatic through CDS framework

### Security Hardening Checklist
- ✅ **Environment Variables**: Sensitive data in service bindings, not code
- ✅ **Dependencies**: Regular security updates (`npm audit`)
- ✅ **Access Control**: Principle of least privilege for service access
- ✅ **Logging**: No sensitive data in logs
- ✅ **Transport Security**: HTTPS for all communications

### Security Monitoring
```bash
# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Check service security
cf security-groups
cf space-users your-space
```

## Operational Runbooks

### Common Operational Tasks

**Application Restart**:
```bash
# Restart application
cf restart bookshop-cap-sample-srv

# Restage application (rebuild droplet)
cf restage bookshop-cap-sample-srv
```

**Log Analysis**:
```bash
# Recent logs
cf logs bookshop-cap-sample-srv --recent

# Follow live logs
cf logs bookshop-cap-sample-srv

# Download log files (if using log drain)
cf logs bookshop-cap-sample-srv --recent > app_logs.txt
```

**Service Management**:
```bash
# Check service status
cf services

# Update service plan (e.g., scale database)
cf update-service bookshop-cap-sample-db -p standard

# Restart service binding
cf unbind-service bookshop-cap-sample-srv bookshop-cap-sample-db
cf bind-service bookshop-cap-sample-srv bookshop-cap-sample-db
cf restart bookshop-cap-sample-srv
```

### Incident Response Procedures

**1. Alert Response**:
- Check application status: `cf apps`
- Review recent logs: `cf logs --recent`
- Verify service dependencies: `cf services`

**2. Common Issues and Solutions**:

**Application Won't Start**:
```bash
# Check application logs
cf logs bookshop-cap-sample-srv --recent

# Check service bindings
cf env bookshop-cap-sample-srv

# Restart application
cf restart bookshop-cap-sample-srv
```

**Database Connection Issues**:
```bash
# Check database service status
cf service bookshop-cap-sample-db

# Restart service binding
cf unbind-service bookshop-cap-sample-srv bookshop-cap-sample-db
cf bind-service bookshop-cap-sample-srv bookshop-cap-sample-db
cf restart bookshop-cap-sample-srv
```

**High Memory Usage**:
```bash
# Check memory consumption
cf app bookshop-cap-sample-srv

# Scale memory if needed
cf scale bookshop-cap-sample-srv -m 1024M

# Scale instances if needed
cf scale bookshop-cap-sample-srv -i 2
```

This comprehensive deployment guide ensures reliable, secure, and scalable operation of the SAP BTP CAP Bookshop application across all environments.