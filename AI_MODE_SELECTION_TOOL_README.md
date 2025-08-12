# AI Mode Selection Tool - Implementation Guide

## Overview

The AI Mode Selection Tool is a client-facing solution developed as part of our strategic initiative to increase revenue through value-added services without raising operational costs. The tool integrates a powerful Container Load Planning component that optimizes how shipments are grouped and packed into containers.

## Key Features

### 1. Container Load Planning
- **Volume-based optimization** for ocean freight
- **Priority-based container assignment** using configurable thresholds
- **Support for container types**: 20 ft, 40 ft, 40HC (high cube), LCL
- **GroupMix constraints** for specific destination combinations
- **Mathematical algorithms** for maximizing filler rate performance

### 2. Master Data Management
- **Container Priority Index**: Manage order of container evaluation (40HC, 40FT, 20FT, LCL, GroupMix variants)
- **Container Thresholds**: Configure Min and Max CBM per container priority Index and POL
- **Origin & Destination Master**: Valid POL/POD list for shipment validation

### 3. Upload and Validation Workflow
- **Excel/CSV file upload** with comprehensive validation
- **Mandatory field validation** (Volume, Customer, Shipment ID)
- **Data type validation** (CBM as numeric, date formats)
- **Master data matching** (POL, POD, Customer)
- **Duplicate shipment ID detection**
- **Detailed error reporting** with severity levels

### 4. Container Planning Process
- **Bucketing**: Group shipments by Customer, POL, and POD
- **Priority-based filling**: Use container priority index for optimization
- **Threshold-based assignment**: Min/Max volume thresholds per container type
- **Volume sorting**: Higher volume shipments considered first
- **Container reference creation**: Format: `<CONTAINER>_<COUNT>_<PRIO_INDEX>`

### 5. Hardcoded Consolidation Constraints
Special rules for GroupMix containers with restricted destinations:
- **Restricted destinations**: Peine, Rottendorf, Apfelstädt, Wittenberge, Langenselbold
- **Exception 1**: Limited package inclusion with Haldensleben (≤70 packages)
- **Exception 2**: Majority-based inclusion (>50% volume/package count)

## Technical Implementation

### API Endpoints

#### 1. Shipment Upload (`/api/shipment-upload`)
```typescript
POST /api/shipment-upload
Content-Type: multipart/form-data

Body: {
  file: File (Excel/CSV)
}

Response: {
  success: boolean,
  message: string,
  validation: {
    totalRecords: number,
    validRecords: number,
    invalidRecords: number,
    errors: ValidationError[],
    validData: ShipmentData[]
  }
}
```

#### 2. Container Planning (`/api/container-planning`)
```typescript
POST /api/container-planning
Content-Type: application/json

Body: {
  shipments: ShipmentData[]
}

Response: {
  success: boolean,
  message: string,
  result: {
    assignments: ContainerAssignment[],
    summary: {
      totalShipments: number,
      assignedShipments: number,
      unassignedShipments: number,
      errorShipments: number,
      containersCreated: number,
      optimizationScore: number
    }
  }
}
```

#### 3. Container Thresholds (`/api/container-thresholds`)
```typescript
GET /api/container-thresholds
POST /api/container-thresholds
PUT /api/container-thresholds
DELETE /api/container-thresholds?id={id}
```

### Data Models

#### ShipmentData
```typescript
interface ShipmentData {
  shipmentId: string;
  customer: string;
  pol: string;
  pod: string;
  cbm: number;
  qty: number;
  description?: string;
}
```

#### ContainerAssignment
```typescript
interface ContainerAssignment {
  shipmentId: string;
  customer: string;
  pol: string;
  pod: string;
  cbm: number;
  qty: number;
  optimizedContainerRef: string;
  totalCBM: number;
  totalQty: number;
  mode: "FCL" | "LCL";
  status: "assigned" | "unassigned" | "error";
}
```

#### ContainerThreshold
```typescript
interface ContainerThreshold {
  id: string;
  containerType: string;
  minCBM: number;
  maxCBM: number;
  pol?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## User Interface Flow

### 1. Shipment Upload Page (`/admin/shipment-upload`)
- **File upload zone** with drag & drop support
- **Template download** functionality
- **Progress tracking** for upload process
- **Error handling** with detailed feedback

### 2. Validation Summary Page (`/admin/validation-summary`)
- **Validation statistics** (total, valid, invalid records)
- **Error details table** with filtering and search
- **Export functionality** for error reports
- **Proceed to planning** button (enabled only when all validations pass)

### 3. Container Planning Page (`/admin/container-planning`)
- **Multi-stage progress tracking**:
  - Data Bucketing
  - Container Planning
  - Mode Selection
  - Repositioning Analysis
- **Real-time progress updates**
- **Error handling** for failed stages

### 4. Assignment Results Page (`/admin/assignment-results`)
- **Results table** with filtering and search
- **Summary statistics** (assigned, unassigned, errors)
- **Export functionality** for results
- **Color-coded status indicators**

### 5. Master Data Management
- **Container Thresholds** (`/admin/container-thresholds`)
- **Container Priority** (`/admin/container-priority`)
- **System Settings** (`/admin/system-settings`)

## Container Planning Algorithm

### 1. Data Bucketing
```typescript
// Group shipments by POL, POD, and Customer
const buckets = new Map<string, ShipmentData[]>();
shipments.forEach(shipment => {
  const key = `${shipment.pol}_${shipment.pod}_${shipment.customer}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key)!.push(shipment);
});
```

### 2. Priority-Based Assignment
```typescript
// Sort containers by priority index
const sortedThresholds = thresholds.sort((a, b) => a.priority - b.priority);

// Try each container type in priority order
for (const threshold of sortedThresholds) {
  if (canAssignToContainer(shipments, threshold)) {
    assignToContainer(shipments, threshold);
    break;
  }
}
```

### 3. GroupMix Constraints
```typescript
function checkGroupMixConstraints(shipments: ShipmentData[]): boolean {
  const restrictedCount = shipments.filter(s => 
    restrictedDestinations.includes(s.pod)
  ).length;
  
  // Exception 1: Limited package inclusion with Haldensleben
  if (hasHaldensleben && restrictedCount <= 70) return true;
  
  // Exception 2: Majority-based inclusion
  const restrictedVolume = shipments
    .filter(s => restrictedDestinations.includes(s.pod))
    .reduce((sum, s) => sum + s.cbm, 0);
  const totalVolume = shipments.reduce((sum, s) => sum + s.cbm, 0);
  
  if (restrictedVolume > totalVolume * 0.5) return true;
  
  // Default: No GroupMix if restricted destinations present
  return restrictedCount === 0;
}
```

## Output Format

The system generates container assignments with the following format:

| Shipment | Optimized Container Ref | CBM | Total CBM | Qty | Total Qty |
|----------|----------------------|-----|-----------|-----|-----------|
| QL30257883 | CONT_008_20DRY | 16.2 | 25.752 | 9977 | 13726 |
| QL30258261 | CONT_008_20DRY | 9.552 | 25.752 | 3749 | 13726 |

## Configuration

### Container Thresholds
Default thresholds based on priority index:

| Prio Index | Container Type | POL | Min CBM | Max CBM |
|------------|----------------|-----|---------|---------|
| 1 | 40HC | Yantian | 54.8 | 62 |
| 1 | 40HC | Qingdao | 54 | 60 |
| 2 | 40FT | Yantian | 44.8 | 54.8 |
| 2 | 40FT | Qingdao | 43 | 54 |
| 3 | 40HC Groupmix | Yantian | 54.8 | 62 |
| 4 | 40FT Groupmix | Yantian | 23 | 54.8 |
| 5 | 20FT | Yantian | 19.9 | 23 |
| 6 | 20FT Groupmix | Yantian | 19.9 | 23 |
| 7 | LCL | Yantian | 0 | 19.9 |

### Master Data
- **Customers**: ABC Corp, XYZ Ltd, DEF Industries, GHI Trading, JKL Export
- **POLs**: Shanghai, Ningbo, Qingdao, Tianjin, Dalian, Yantian
- **PODs**: Los Angeles, Rotterdam, Hamburg, Antwerp, Felixstowe, Peine, Rottendorf, Apfelstädt, Wittenberge, Langenselbold, Haldensleben, Altenkunstadt, Sonnefeld, Ohrdruf

## Testing

### Sample Data
A sample CSV template is provided at `/public/shipment_template.csv` with 15 test shipments covering various scenarios:
- Different container types and volumes
- Restricted destinations for GroupMix testing
- Various POL/POD combinations
- Edge cases for validation testing

### Validation Rules
1. **Mandatory fields**: Shipment ID, Customer, POL, POD, CBM, Qty
2. **Data types**: CBM must be positive number, Qty must be positive integer
3. **Master data**: Customer, POL, POD must exist in master data
4. **Duplicates**: Shipment ID must be unique
5. **File size**: Maximum 10MB
6. **File types**: Excel (.xlsx, .xls) only

## Future Enhancements

1. **Cost-based optimization** with threshold-based decision making
2. **Support for other modes** (truck, air freight)
3. **Real-time collaboration** features
4. **Advanced analytics** and reporting
5. **Integration with external systems**
6. **Machine learning** for improved optimization
7. **Mobile application** support

## Deployment

The application is built with Next.js 15 and includes:
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Zod** for validation
- **TanStack Table** for data tables
- **React Hot Toast** for notifications

To run the application:
```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Security Considerations

1. **Authentication**: Admin-only access to master data management
2. **File validation**: Strict file type and size validation
3. **Input sanitization**: All user inputs are validated and sanitized
4. **Error handling**: Comprehensive error handling without exposing sensitive information
5. **Session management**: Secure session storage for temporary data

## Performance Considerations

1. **File processing**: Asynchronous file upload and processing
2. **Progress tracking**: Real-time progress updates for long-running operations
3. **Data pagination**: Efficient handling of large datasets
4. **Caching**: Session storage for temporary data
5. **Optimization**: Efficient algorithms for container planning

This implementation provides a solid foundation for the AI Mode Selection Tool with all the required functionality for container load planning and optimization. 