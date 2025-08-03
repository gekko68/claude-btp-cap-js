# System Architecture Documentation

## Purpose
This document outlines the system design, architectural decisions, and technical implementation patterns for the SAP BTP CAP Bookshop sample application. It serves as a comprehensive guide for developers, architects, and maintainers to understand the system's structure and make informed decisions about future enhancements.

## System Architecture Overview

### High-Level Architecture
The application follows a **three-tier cloud-native architecture** designed for the SAP Business Technology Platform:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│      Layer      │◄──►│     Logic       │◄──►│     Layer       │
│                 │    │     Layer       │    │                 │
│ • OData API     │    │ • CAP Services  │    │ • SQLite (Dev)  │
│ • REST API      │    │ • Custom Logic  │    │ • HANA (Prod)   │
│ • Metadata      │    │ • Validations   │    │ • Managed Data  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Design Patterns

#### Domain-Driven Design (DDD)
- **Entity-First Modeling**: Domain entities (Books) defined in CDS schema files
- **Service Boundaries**: Clear separation between data models and service interfaces
- **Business Logic Encapsulation**: Custom actions and functions encapsulate domain operations

#### Event-Driven Architecture
- **Before/After Hooks**: Interceptors for data validation and logging
- **Custom Event Handlers**: Business logic triggered by service operations
- **Audit Trail**: Automatic tracking of data changes through CAP's managed aspects

## Technology Stack and Framework Choices

### Core Framework Selection
**SAP Cloud Application Programming Model (CAP) v9**
- **Rationale**: Official SAP framework for cloud-native application development
- **Benefits**: Built-in OData support, automatic API generation, integrated security
- **Trade-offs**: SAP ecosystem dependency vs. broader Node.js community libraries

### Runtime Environment
**Node.js 18+ with Express.js**
- **Rationale**: CAP's primary runtime environment with excellent performance
- **Benefits**: Large ecosystem, excellent debugging tools, cloud-native deployment support
- **Trade-offs**: Single-threaded nature vs. natural fit for I/O-intensive operations

### Database Strategy
**Multi-Database Support Pattern**
- **Development**: SQLite for local development and testing
- **Production**: SAP HANA Cloud for enterprise-grade performance and features
- **Rationale**: Enables rapid local development while supporting production scalability

## Component Architecture

### Data Model Layer (`/db`)
**CDS-First Data Modeling**
```
db/
├── schema.cds          # Entity definitions with managed aspects
└── data/              # Seed data for development
    └── bookshop-Books.csv
```

**Key Design Decisions**:
- **Managed Aspects**: Leverages CDS `managed` and `cuid` for automatic auditing
- **Type Safety**: Strong typing with constraints (String lengths, Decimal precision)
- **Semantic Naming**: Clear, domain-specific property names

### Service Layer (`/srv`)
**Service-Oriented Architecture**
```
srv/
├── bookshop-service.cds    # Service interface definition
└── bookshop-service.js     # Business logic implementation
```

**Service Design Patterns**:
- **Projection Pattern**: Service entities as projections of database entities
- **Custom Actions**: `createBook` for complex business operations
- **Query Functions**: `getBooksByGenre` for filtered data retrieval
- **Event Interception**: Before/after hooks for cross-cutting concerns

### Application Layer
**Server Configuration and Bootstrap**
```
server.js                   # Application entry point and configuration
package.json               # Dependencies and CDS configuration
```

**Configuration Strategy**:
- **Environment-Specific Settings**: Development vs. production database configuration
- **Logging Configuration**: Service-specific log levels
- **Security Integration**: XSUAA authentication for production

## Database Design and Data Flow

### Entity Relationship Design
**Books Entity Schema**:
```cds
entity Books : managed, cuid {
  title       : String(100) not null;
  author      : String(100);
  genre       : String(50);
  price       : Decimal(10,2);
  stock       : Integer default 0;
  description : String(500);
  publishedAt : Date;
}
```

**Design Rationale**:
- **Managed Aspects**: Automatic `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy` fields
- **CUID**: Universally unique identifiers for distributed systems
- **Constraints**: String length limits for database optimization
- **Defaults**: Stock defaults to 0 for new books

### Data Flow Patterns
**Request Processing Flow**:
1. **HTTP Request** → Express.js router
2. **OData Parsing** → CAP framework request processing
3. **Before Hooks** → Logging and validation
4. **Business Logic** → Custom service handlers
5. **Database Operation** → CQL query execution
6. **After Hooks** → Response transformation and logging
7. **HTTP Response** → JSON/OData format

## Security Architecture

### Authentication and Authorization
**XSUAA Integration Pattern**
```json
{
  "scopes": ["$XSAPPNAME.Admin", "$XSAPPNAME.User"],
  "role-templates": [
    {"name": "Admin", "scope-references": ["$XSAPPNAME.Admin"]},
    {"name": "User", "scope-references": ["$XSAPPNAME.User"]}
  ]
}
```

**Security Layers**:
- **Transport Security**: HTTPS enforced in production environments
- **Authentication**: OAuth 2.0 via XSUAA service
- **Authorization**: Role-based access control with service-level restrictions
- **Input Validation**: Type checking and constraint validation via CDS

### Data Protection
**Privacy and Compliance**:
- **Personal Data Annotations**: Ready for `@PersonalData` annotations
- **Audit Logging**: Automatic change tracking through managed aspects
- **Data Encryption**: Leveraged through SAP HANA Cloud and BTP platform services

## Performance and Scalability Considerations

### Database Optimization
**Query Performance Strategies**:
- **Projection-Based Queries**: Limit data transfer through service projections
- **Index Strategy**: Leverage HANA's automatic index optimization
- **Connection Pooling**: Built-in connection management through CAP framework

### Application Scalability
**Horizontal Scaling Patterns**:
- **Stateless Services**: No server-side session state
- **Database Connection Sharing**: Efficient connection utilization
- **Memory Management**: Streaming for large result sets (future enhancement)

### Caching Strategy
**Future Enhancements**:
- **Service-Level Caching**: Redis integration for frequent queries
- **CDN Integration**: Static content delivery optimization
- **Database Query Optimization**: HANA-specific performance tuning

## Key Architectural Decisions and Trade-offs

### Decision 1: CAP Framework vs. Express.js Native
**Chosen**: SAP CAP Framework
**Rationale**: 
- Built-in OData support reduces boilerplate code
- Automatic API documentation generation
- Integrated security and multi-tenancy support
- SAP ecosystem alignment

**Trade-offs**:
- ✅ Rapid development and reduced maintenance
- ✅ Enterprise-grade features out-of-the-box
- ⚠️ Framework lock-in and learning curve
- ⚠️ Limited to SAP ecosystem patterns

### Decision 2: SQLite + HANA vs. Single Database
**Chosen**: Multi-database development pattern
**Rationale**:
- Enables rapid local development without cloud dependencies
- Production database optimized for enterprise workloads
- Cost-effective development environment

**Trade-offs**:
- ✅ Fast local development cycles
- ✅ Production database optimization
- ⚠️ Potential development/production parity issues
- ⚠️ Additional complexity in deployment pipeline

### Decision 3: Custom Actions vs. Generic CRUD
**Chosen**: Hybrid approach with custom business actions
**Rationale**:
- Standard CRUD operations for simple entity management
- Custom actions for complex business logic (createBook)
- Query functions for optimized data retrieval

**Trade-offs**:
- ✅ Flexibility for business logic implementation
- ✅ Optimized query patterns
- ⚠️ Increased API surface area
- ⚠️ Additional testing complexity

## Integration Patterns

### SAP BTP Service Integration
**Current Integrations**:
- **XSUAA Service**: Authentication and authorization
- **Application Logging Service**: Centralized log aggregation
- **Service Manager**: Database service provisioning

**Future Integration Opportunities**:
- **SAP Connectivity Service**: On-premise system integration
- **SAP Destination Service**: External service connectivity
- **SAP Event Mesh**: Event-driven architecture expansion

### API Design Patterns
**OData v4 Compliance**:
- Standard CRUD operations following OData conventions
- Custom actions and functions for business operations
- Metadata-driven client generation support
- Filter, sort, and pagination support

## Deployment Architecture

### Multi-Target Application (MTA) Pattern
**Component Separation**:
- **Service Module**: Node.js application with business logic
- **Database Module**: HANA database artifacts and deployment
- **Security Module**: XSUAA service configuration

**Resource Management**:
- **Service Bindings**: Automatic credential injection
- **Environment Variables**: Configuration through service bindings
- **Health Checks**: Built-in application monitoring endpoints

This architecture provides a solid foundation for enterprise SAP CAP applications while maintaining flexibility for future enhancements and scaling requirements.