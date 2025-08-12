# File Upload System with Multer

## Overview

This system implements a comprehensive file upload solution using Multer for handling Excel file uploads with extensive validation and duplicate checking.

## Features

### 1. File Upload with Multer
- **Local Storage**: Files are stored in `public/uploads/` directory
- **Unique Naming**: Files are renamed with timestamps to avoid conflicts
- **File Type Validation**: Only Excel files (.xlsx, .xls) are accepted
- **Size Limits**: Maximum 10MB file size

### 2. Comprehensive Validation

#### File-Level Validations:
- **Duplicate File Names**: Prevents uploading files with the same name
- **File Type Check**: Validates Excel format only
- **File Size Check**: Enforces 10MB limit

#### Meta Field Validations:
- **Header Format**: Validates exact column headers
- **Spelling Checks**: Detects and warns about typos (e.g., "CUSTOME" vs "CUSTOMER")
- **Required Fields**: Ensures all mandatory columns are present
- **Extra Headers**: Warns about unexpected columns

#### Data Validations:
- **Duplicate Rows**: Identifies identical rows within the file
- **Duplicate Shipment IDs**: Checks for duplicate shipment IDs within the file
- **Cross-File Duplicates**: Prevents duplicate shipment IDs across all uploaded files
- **Data Type Validation**: Validates numbers, dates, and required fields
- **Master Data Matching**: Validates against predefined customer, POL, and POD lists

## Expected File Format

### Headers (in order):
```
SHIPMENT,CUSTOME,SUPPLIER,VOLUME,Qty,RCV/PUG,POL,Destsite
```

### Sample Data:
```
HL3025608,OTTO GME,HUI ZHOU,7.49,78,14/7/2025,Yantian,HALDENSLEBEN
QL3025645,BON PRIX,HK TSO SI,1.104,8003,17/7/2025,Qingdao,Haldensleben
QL30257883,ABC Corp,QINGDAO,16.2,9977,21/7/2022,Yantian,Peine
```

### Field Descriptions:
- **SHIPMENT**: Unique shipment identifier (alphanumeric)
- **CUSTOME**: Customer name (note: typo in original data)
- **SUPPLIER**: Supplier name
- **VOLUME**: Volume in cubic meters (positive decimal)
- **Qty**: Quantity (positive integer)
- **RCV/PUG**: Date in DD/MM/YYYY format
- **POL**: Port of Loading
- **Destsite**: Destination site

## Validation Rules

### 1. File Name Uniqueness
- System checks if a file with the same name already exists
- Returns error if duplicate filename is detected

### 2. Meta Field Formatting/Spelling
- Validates exact header names
- Warns about typos (e.g., "CUSTOME" should be "CUSTOMER")
- Checks for missing required headers
- Warns about extra headers

### 3. No Duplicate Rows
- Identifies completely identical rows within the file
- Reports row numbers where duplicates are found

### 4. No Duplicate Entries (File Level)
- Checks for duplicate shipment IDs within the current file
- Checks for duplicate shipment IDs across all previously uploaded files
- Prevents data integrity issues

## API Endpoints

### POST `/api/shipment-upload`
Uploads and validates a file.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (Excel file)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded and validated successfully",
  "validation": {
    "totalRecords": 15,
    "validRecords": 12,
    "invalidRecords": 3,
    "errors": [...],
    "validData": [...],
    "fileValidation": {
      "isValid": true,
      "errors": [],
      "warnings": ["Header 'CUSTOME' should be 'CUSTOMER' (typo detected)"],
      "headers": [...],
      "dataRows": [...],
      "duplicateRows": [],
      "duplicateShipments": []
    },
    "crossFileDuplicates": []
  },
  "fileName": "shipments.xlsx",
  "storedFileName": "shipments_1703123456789.xlsx",
  "fileSize": 2048
}
```

### GET `/api/shipment-upload`
Retrieves list of uploaded files.

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "originalName": "shipments.xlsx",
      "storedName": "shipments_1703123456789.xlsx",
      "uploadDate": "2023-12-21T10:30:45.123Z",
      "fileSize": 2048,
      "totalRows": 15,
      "validRows": 12,
      "invalidRows": 3
    }
  ]
}
```

## Error Handling

### File Upload Errors:
- `Invalid file type. Only Excel files (.xlsx, .xls) are allowed.`
- `File size exceeds 10MB limit`
- `File "filename.xlsx" already exists. Please rename the file and try again.`

### Validation Errors:
- `Missing required headers: SHIPMENT, CUSTOME`
- `Header "CUSTOME" should be "CUSTOMER" (typo detected)`
- `Duplicate rows found at: 3, 7`
- `Duplicate shipment IDs: HL3025608 (rows: 2, 5)`
- `Duplicate shipment IDs found in other files: HL3025608 (also found in shipments_old.xlsx)`

## File Storage

### Directory Structure:
```
public/
  uploads/
    file_info.json          # Metadata about uploaded files
    shipments_1703123456789.xlsx
    shipments_1703123456790.xlsx
    ...
```

### File Naming Convention:
- Original: `shipments.xlsx`
- Stored: `shipments_1703123456789.xlsx` (with timestamp)

## Usage Examples

### 1. Valid File Upload
```javascript
const formData = new FormData();
formData.append('file', excelFile);

const response = await fetch('/api/shipment-upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.validation);
```

### 2. Check Uploaded Files
```javascript
const response = await fetch('/api/shipment-upload');
const result = await response.json();
console.log(result.files);
```

## Configuration

### Multer Configuration (`src/utils/multerConfig.ts`):
- Storage: Local disk storage
- File filter: Excel files only
- Size limit: 10MB
- File count: 1 file per request

### Validation Configuration (`src/utils/fileUtils.ts`):
- Expected headers defined
- Master data lists for validation
- Duplicate checking logic
- Cross-file validation

## Security Considerations

1. **File Type Validation**: Strict MIME type checking
2. **Size Limits**: Prevents large file uploads
3. **Path Traversal**: Secure file naming and storage
4. **Error Handling**: No sensitive information exposed
5. **Input Sanitization**: All inputs validated and sanitized

## Performance Considerations

1. **Asynchronous Processing**: Non-blocking file operations
2. **Efficient Validation**: Optimized duplicate checking algorithms
3. **Memory Management**: Stream-based file processing
4. **Caching**: File metadata stored for quick access
5. **Cleanup**: Old files can be automatically removed

## Future Enhancements

1. **Excel Library Integration**: Use `xlsx` or `exceljs` for proper Excel parsing
2. **Database Storage**: Move file metadata to database
3. **Cloud Storage**: Integrate with AWS S3 or similar
4. **Batch Processing**: Support for multiple file uploads
5. **Real-time Validation**: Client-side validation before upload
6. **File Compression**: Automatic compression for large files
7. **Version Control**: Track file versions and changes
