# Logging, Monitoring, and Debugging Guide

## Purpose
This document provides comprehensive guidance on logging, monitoring, debugging, and observability for the SAP BTP CAP Bookshop application. It establishes patterns for effective troubleshooting, performance monitoring, and operational visibility in both development and production environments.

## Logging Strategy and Philosophy

### Logging Principles
- **Structured Logging**: Consistent, machine-readable log formats for automated analysis
- **Contextual Information**: Include request correlation IDs and business context
- **Performance Awareness**: Minimal logging overhead in production environments
- **Security Conscious**: Never log sensitive data (credentials, personal information)
- **Actionable Information**: Log entries that support specific operational decisions

### Log Level Strategy
**DEBUG**: Detailed execution flow for development troubleshooting
**INFO**: Business operations and system state changes
**WARN**: Recoverable issues that require attention
**ERROR**: System failures and unrecoverable conditions
**FATAL**: Critical system failures requiring immediate intervention

## CAP Framework Logging Implementation

### Service-Level Logging Configuration
The application uses CAP's built-in logging capabilities with service-specific configuration:

```javascript
// package.json - CDS Configuration
"cds": {
  "log": {
    "levels": {
      "bookshop-service": "info",
      "server": "info"
    }
  }
}
```

### Service Implementation Logging Patterns

#### Structured Logging in Service Handlers
```javascript
// srv/bookshop-service.js
const LOG = cds.log('bookshop-service');

// Request logging with context
this.before('READ', 'Books', async (req) => {
  LOG.info('Reading books with query:', req.query);
});

// Response logging with metrics
this.after('READ', 'Books', (books, req) => {
  LOG.info(`Returned ${Array.isArray(books) ? books.length : 1} book(s)`);
  return books;
});

// Business operation logging
this.on('createBook', async (req) => {
  const { title, author } = req.data;
  LOG.info(`Creating new book: ${title} by ${author}`);
  
  try {
    // Business logic
    const bookId = result.lastID || result.insertId;
    LOG.info(`Successfully created book with ID: ${bookId}`);
  } catch (error) {
    LOG.error('Error creating book:', error);
    req.error(500, 'Failed to create book');
  }
});
```

#### Server-Level Logging
```javascript
// server.js
const LOG = cds.log('server');

async function startServer() {
  try {
    LOG.info('Starting CAP server...');
    const server = await cds.serve('all').from('srv').at(process.env.PORT || 4004);
    
    server.on('listening', () => {
      const { url } = server;
      LOG.info(`CAP server is running at: ${url}`);
      LOG.info(`API endpoints available at: ${url}/bookshop`);
    });
    
  } catch (error) {
    LOG.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

## Log Formats and Structured Data

### Development Environment
**Format**: Human-readable with color coding
**Output**: Console with timestamp and log level
**Example**:
```
[2024-01-15T10:30:45.123Z] INFO bookshop-service: Creating new book: Pride and Prejudice by Jane Austen
[2024-01-15T10:30:45.156Z] INFO bookshop-service: Successfully created book with ID: 123e4567-e89b-12d3-a456-426614174000
```

### Production Environment
**Format**: JSON structured logging for automated processing
**Output**: Application Logs service on SAP BTP
**Example**:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "bookshop-service",
  "message": "Creating new book",
  "context": {
    "title": "Pride and Prejudice",
    "author": "Jane Austen",
    "correlationId": "req-123e4567-e89b-12d3"
  }
}
```

### Error Logging Patterns
**Comprehensive Error Context**:
```javascript
LOG.error('Database operation failed', {
  operation: 'INSERT',
  entity: 'Books',
  error: error.message,
  stack: error.stack,
  context: req.data,
  correlationId: req.id
});
```

## Monitoring and Observability Setup

### SAP BTP Application Logging Service
**Configuration in mta.yaml**:
```yaml
resources:
  - name: bookshop-cap-sample-logging
    type: org.cloudfoundry.managed-service
    parameters:
      service: application-logs
      service-name: ${space}-bookshop-cap-sample-logging
      service-plan: lite
```

### Application Performance Monitoring
**Key Metrics to Monitor**:
- **Request Volume**: Number of API requests per minute
- **Response Times**: P50, P95, P99 response time percentiles
- **Error Rates**: HTTP 4xx and 5xx error percentages
- **Database Performance**: Query execution times and connection pool usage
- **Memory Usage**: Application memory consumption patterns
- **CPU Utilization**: Processing load and resource efficiency

### Health Check Implementation
```javascript
// Health check endpoint for monitoring
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
    
    LOG.debug('Health check requested', healthStatus);
    res.json(healthStatus);
  });
});
```

## Debugging Procedures and Common Troubleshooting

### Local Development Debugging
**Enable Debug Logging**:
```bash
# Enable all debug logs
DEBUG=* npm run dev

# Service-specific debug logs
DEBUG=serve,db npm run dev

# CAP framework debug logs
DEBUG=cds:* npm run dev
```

**VS Code Debugging Configuration**:
```json
// .vscode/launch.json
{
  "name": "Debug CAP Application",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/server.js",
  "env": {
    "DEBUG": "bookshop-service,server",
    "NODE_ENV": "development"
  },
  "console": "integratedTerminal"
}
```

### Common Troubleshooting Scenarios

#### Database Connection Issues
**Symptoms**: Application fails to start or database operations fail
**Debug Steps**:
1. Check database service binding: `cf env bookshop-cap-sample-srv`
2. Verify database connectivity: `cds deploy --to sqlite:memory`
3. Enable database debug logging: `DEBUG=db npm run dev`

**Log Analysis**:
```javascript
// Check for database connection logs
LOG.debug('Database connection attempt', {
  kind: cds.env.requires.db.kind,
  credentials: cds.env.requires.db.credentials ? 'present' : 'missing'
});
```

#### Authentication/Authorization Issues
**Symptoms**: 401/403 errors or authentication service failures
**Debug Steps**:
1. Verify XSUAA service binding: `cf services`
2. Check JWT token validation: Enable authentication debug logs
3. Validate role assignments in SAP BTP cockpit

**Log Analysis**:
```javascript
// Authentication event logging
this.before('*', (req) => {
  LOG.debug('Request authentication status', {
    authenticated: !!req.user,
    user: req.user?.id,
    scopes: req.user?.attr?.scopes
  });
});
```

#### Performance Issues
**Symptoms**: Slow response times or high resource usage
**Debug Steps**:
1. Enable query performance logging
2. Monitor memory usage patterns
3. Analyze database query execution plans

**Performance Logging**:
```javascript
// Request timing middleware
this.before('*', (req) => {
  req.startTime = Date.now();
});

this.after('*', (data, req) => {
  const duration = Date.now() - req.startTime;
  LOG.info('Request completed', {
    method: req.method,
    path: req.path,
    duration: `${duration}ms`,
    status: req.res?.statusCode
  });
});
```

## Error Handling Patterns and Recovery Procedures

### Error Classification and Response
**Business Logic Errors**: Validation failures, business rule violations
```javascript
// Graceful business error handling
if (!title || title.length === 0) {
  LOG.warn('Book creation failed: missing title', { context: req.data });
  req.error(400, 'Title is required for book creation');
}
```

**System Errors**: Database failures, external service issues
```javascript
// System error with recovery information
try {
  await INSERT.into(Books).entries(bookData);
} catch (error) {
  LOG.error('Database insert failed', {
    error: error.message,
    recovery: 'Retry operation or check database connectivity',
    context: bookData
  });
  req.error(500, 'Unable to save book. Please try again.');
}
```

### Circuit Breaker Pattern Implementation
```javascript
// Future enhancement: Circuit breaker for external services
const circuitBreaker = {
  failures: 0,
  threshold: 5,
  timeout: 30000,
  
  async call(operation) {
    if (this.failures >= this.threshold) {
      LOG.warn('Circuit breaker open, operation blocked');
      throw new Error('Service temporarily unavailable');
    }
    
    try {
      const result = await operation();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      LOG.error('Circuit breaker: operation failed', { 
        failures: this.failures,
        threshold: this.threshold 
      });
      throw error;
    }
  }
};
```

## Log Aggregation and Analysis Tools

### SAP BTP Application Logging
**Log Aggregation**: Centralized collection from all application instances
**Search Capabilities**: Text search and filtering by log level, timestamp, service
**Alerting**: Automated alerts for error rate thresholds

### Log Analysis Queries
**High Error Rate Detection**:
```
level:ERROR AND service:bookshop-service 
| stats count by bin(timestamp, 1m)
| where count > 10
```

**Performance Analysis**:
```
service:bookshop-service AND message:"Request completed"
| extract duration
| stats avg(duration), p95(duration) by bin(timestamp, 5m)
```

### Integration with External Tools
**Grafana Dashboard**: Custom dashboards for application metrics
**Prometheus Integration**: Metrics collection and alerting
**Kibana/Elasticsearch**: Advanced log analysis and visualization

## Operational Monitoring and Alerting

### Key Performance Indicators (KPIs)
- **Availability**: Service uptime percentage
- **Performance**: Average response time < 500ms
- **Error Rate**: < 1% of requests result in errors
- **Throughput**: Requests per second capacity

### Alert Configuration
**Critical Alerts**:
- Application startup failures
- Database connection failures
- High error rates (> 5% of requests)
- Response time degradation (> 2 seconds)

**Warning Alerts**:
- Increased response times (> 1 second)
- Memory usage spikes
- Authentication service issues

### Incident Response Procedures
1. **Alert Notification**: Immediate notification to on-call team
2. **Log Analysis**: Review recent logs for error patterns
3. **Health Check**: Verify service dependencies and connectivity
4. **Recovery Actions**: Restart services, check configurations
5. **Post-Incident Review**: Analyze root cause and improve monitoring

This comprehensive logging and monitoring strategy ensures effective operational visibility while supporting rapid troubleshooting and continuous improvement of the application's reliability and performance.