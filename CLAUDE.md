# SAP BTP CAP JavaScript Project

## Project Overview
This is a Node.js project built using the SAP Cloud Application Programming (CAP) model for SAP Business Technology Platform (BTP). CAP provides a framework for building enterprise-grade applications with built-in support for multitenancy, authentication, and integration with SAP services.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: SAP CAP (Cloud Application Programming Model)
- **Language**: JavaScript/TypeScript
- **Platform**: SAP Business Technology Platform (BTP)
- **Database**: SAP HANA Cloud / SQLite (for local development)

## Development Setup

### Prerequisites
- Node.js (version 18+ recommended)
- npm or yarn
- SAP CAP CLI: `npm install -g @sap/cds-dk`
- Cloud Foundry CLI (for BTP deployment)

### Local Development
```bash
# Install dependencies
npm install

# Start local development server
npm run start
# or
cds serve

# Watch mode for development
cds watch
```

### Database Management
```bash
# Deploy database schema locally
cds deploy --to sqlite

# For SAP HANA
cds deploy --to hana
```

## Project Structure
```
├── app/                    # UI applications (Fiori Elements, custom UIs)
├── db/                     # Database artifacts (CDS models, data)
├── srv/                    # Service implementations
├── package.json           # Project configuration
├── .cdsrc.json           # CAP configuration
└── mta.yaml              # Multi-target application descriptor
```

## CAP Best Practices

### CDS Modeling
- Use proper naming conventions (entities in PascalCase, properties in camelCase)
- Define associations and compositions correctly
- Use aspects for reusable model fragments
- Implement proper data types and constraints

### Service Implementation
- Keep service logic in separate files under `srv/`
- Use CAP's built-in features (authentication, authorization, etc.)
- Implement proper error handling
- Use transactions for data consistency

### Security
- Always implement authentication and authorization
- Use `@requires` and `@restrict` annotations
- Validate input data
- Follow principle of least privilege

### Performance
- Use projections to limit data transfer
- Implement proper caching strategies
- Optimize database queries
- Use streaming for large datasets

## Git Workflow

### Branch Strategy
- `main` - production-ready code
- `develop` - integration branch
- `feature/*` - feature development
- `hotfix/*` - production fixes

### Commit Guidelines
```bash
# Format: type(scope): description
feat(service): add customer registration endpoint
fix(db): resolve duplicate key constraint issue
docs(readme): update setup instructions
```

### Before Committing
```bash
# Run linting
npm run lint

# Run tests
npm test

# Build the project
npm run build

# Check for security vulnerabilities
npm audit
```

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests
```bash
# Test with local database
npm run test:integration

# Test against HANA
npm run test:hana
```

## Deployment

### Local Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### SAP BTP Deployment
```bash
# Build MTA archive
mbt build

# Deploy to Cloud Foundry
cf deploy mta_archives/*.mtar
```

## Environment Configuration

### Development (.env.local)
```
CDS_ENV=development
DEBUG=*
```

### Production (BTP)
- Configure service bindings
- Set up destination services
- Configure authentication (XSUAA)

## Common Commands
```bash
# CAP Commands
cds init                    # Initialize new CAP project
cds serve                   # Start development server
cds watch                   # Watch mode with auto-reload
cds deploy                  # Deploy database schema
cds build                   # Build for production
cds compile                 # Compile CDS models

# Development
npm run start              # Start application
npm run dev                # Development mode
npm run test               # Run tests
npm run lint               # Lint code
npm run build              # Build for production

# Database
cds deploy --to sqlite     # Local SQLite database
cds deploy --to hana       # SAP HANA deployment
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: CAP default port is 4004
2. **Database connection**: Check service bindings and credentials
3. **Authentication**: Verify XSUAA configuration
4. **Deployment**: Check MTA descriptor and service dependencies

### Debug Mode
```bash
# Enable debug logging
DEBUG=* cds serve

# Specific debug categories
DEBUG=serve,db cds serve
```

## Resources
- [SAP CAP Documentation](https://cap.cloud.sap/)
- [CAP Samples](https://github.com/SAP-samples/cloud-cap-samples)
- [SAP BTP Documentation](https://help.sap.com/docs/btp)
- [Fiori Elements](https://ui5.sap.com/fiori-elements)

## Code Quality

### Linting
- Use ESLint with SAP-specific rules
- Configure Prettier for code formatting
- Set up pre-commit hooks

### Type Safety
- Consider migrating to TypeScript
- Use JSDoc for type annotations
- Implement proper input validation

## Performance Monitoring
- Use SAP Application Logging
- Implement health checks
- Monitor memory usage and response times
- Set up alerts for critical thresholds