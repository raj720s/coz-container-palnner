# Excel Validation Enhancement ✅

## 🎯 **Overview**

Enhanced Excel file validation to ensure proper column headers and data structure based on the provided image format. The system now validates:

- **Column Headers**: Expected headers from the image
- **Data Content**: Field-specific validation rules
- **Data Types**: Proper number, date, and text validation
- **Duplicates**: Check for duplicate shipment IDs
- **Structure**: File format and minimum requirements

## 📋 **Expected Column Headers**

Based on the image, the system expects these headers:

### **Required Headers:**
1. **SHIPMENT** - Unique shipment identifier
2. **CUSTOME** - Customer name (note: typo for "CUSTOMER")
3. **SUPPLIER** - Supplier name
4. **VOLUME** - Volume in cubic meters
5. **Qty** - Quantity of items
6. **RCV/PUG** - Receive/Pickup date (DD/MM/YYYY format)
7. **POL** - Port of Loading
8. **Destsite** - Destination site

### **Optional Headers:**
9. **POL detail** - Additional POL information
10. **POL In FCL Rates?** - FCL rate information
11. **POL In LCL Rates?** - LCL rate information
12. **POL ALTERNATIVE** - Alternative port options

## 🔧 **Enhanced Validation Functions**

### **1. Structure Validation (`validateExcelStructure`)**

#### **Header Validation:**
```typescript
// Check for missing required headers
const requiredHeaders = ['SHIPMENT', 'CUSTOME', 'SUPPLIER', 'VOLUME', 'Qty', 'RCV/PUG', 'POL', 'Destsite'];
const missingHeaders = requiredHeaders.filter(header => 
  !data.headers.some(h => h.toLowerCase() === header.toLowerCase())
);

// Check for unexpected headers
const unexpectedHeaders = data.headers.filter(header => 
  !expectedHeaders.some(expected => expected.toLowerCase() === header.toLowerCase())
);

// Check for header typos
data.headers.forEach(header => {
  if (header.toLowerCase() === 'custome') {
    warnings.push('Header "CUSTOME" should be "CUSTOMER" (typo detected)');
  }
});
```

#### **File Structure Validation:**
- ✅ Minimum data rows requirement
- ✅ Header row presence
- ✅ Data row presence
- ✅ File format validation

### **2. Content Validation (`validateExcelContent`)**

#### **Field-Specific Validation:**

**SHIPMENT ID:**
```typescript
if (!row['SHIPMENT'] || row['SHIPMENT'].toString().trim() === '') {
  errors.push({
    rowNumber,
    field: 'SHIPMENT',
    errorMessage: 'Shipment ID is required',
    value: row['SHIPMENT'] || '',
    severity: 'error'
  });
}
```

**CUSTOMER:**
```typescript
if (!row['CUSTOME'] || row['CUSTOME'].toString().trim() === '') {
  errors.push({
    rowNumber,
    field: 'CUSTOME',
    errorMessage: 'Customer is required',
    value: row['CUSTOME'] || '',
    severity: 'error'
  });
}
```

**VOLUME:**
```typescript
const volume = parseFloat(row['VOLUME']);
if (isNaN(volume) || volume <= 0) {
  errors.push({
    rowNumber,
    field: 'VOLUME',
    errorMessage: 'Volume must be a positive number',
    value: row['VOLUME'] || '',
    severity: 'error'
  });
}
```

**QUANTITY:**
```typescript
const qty = parseInt(row['Qty']);
if (isNaN(qty) || qty <= 0) {
  errors.push({
    rowNumber,
    field: 'Qty',
    errorMessage: 'Quantity must be a positive integer',
    value: row['Qty'] || '',
    severity: 'error'
  });
}
```

**DATE FORMAT:**
```typescript
const rcvPug = row['RCV/PUG'];
if (rcvPug && rcvPug.toString().trim() !== '') {
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (!dateRegex.test(rcvPug.toString())) {
    errors.push({
      rowNumber,
      field: 'RCV/PUG',
      errorMessage: 'Date must be in DD/MM/YYYY format',
      value: rcvPug.toString(),
      severity: 'error'
    });
  }
}
```

### **3. Duplicate Validation (`checkDuplicateShipments`)**

#### **Duplicate Detection:**
```typescript
const shipmentIds = new Map<string, number[]>();

data.rows.forEach((row, index) => {
  const shipmentId = row['SHIPMENT']?.toString().trim();
  if (shipmentId) {
    if (!shipmentIds.has(shipmentId)) {
      shipmentIds.set(shipmentId, []);
    }
    shipmentIds.get(shipmentId)!.push(index + 2);
  }
});

shipmentIds.forEach((rowNumbers, shipmentId) => {
  if (rowNumbers.length > 1) {
    rowNumbers.forEach(rowNumber => {
      errors.push({
        rowNumber,
        field: 'SHIPMENT',
        errorMessage: `Duplicate shipment ID "${shipmentId}" found`,
        value: shipmentId,
        severity: 'error'
      });
    });
  }
});
```

## 🔄 **Integration with Upload API**

### **Enhanced Upload Process:**

```typescript
// Read Excel file using xlsx
const excelBytes = await file.arrayBuffer();
const workbook = XLSX.read(new Uint8Array(excelBytes), { type: 'array' });

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON with headers
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const headers = jsonData[0] as string[];
const dataRows = jsonData.slice(1) as string[][];

// Create Excel data structure
const excelData = {
  headers,
  rows: dataRows.map(row => {
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });
    return rowData;
  }),
  sheetName
};

// Comprehensive validation
const structureValidation = validateExcelStructure(excelData);
const contentValidation = validateExcelContent(excelData);
const duplicateValidation = checkDuplicateShipments(excelData);

// Combine all validation errors
const allValidationErrors = [
  ...fileValidation.errors,
  ...structureValidation.errors,
  ...contentValidation,
  ...duplicateValidation
];
```

## ✅ **Validation Rules**

### **1. Header Validation:**
- ✅ **Required Headers**: All 8 required headers must be present
- ✅ **Header Format**: Exact case-sensitive matching
- ✅ **Unexpected Headers**: Warning for extra headers
- ✅ **Header Typos**: Warning for "CUSTOME" vs "CUSTOMER"

### **2. Data Validation:**
- ✅ **Required Fields**: SHIPMENT, CUSTOME, SUPPLIER, VOLUME, Qty, RCV/PUG, POL, Destsite
- ✅ **Data Types**: Numbers for VOLUME and Qty
- ✅ **Date Format**: DD/MM/YYYY for RCV/PUG
- ✅ **Positive Values**: Volume and quantity must be > 0
- ✅ **Non-Empty Fields**: Required fields cannot be empty

### **3. Duplicate Validation:**
- ✅ **Shipment IDs**: No duplicate shipment IDs within file
- ✅ **Cross-File**: No duplicate shipment IDs across files
- ✅ **Case Insensitive**: Duplicate detection is case-insensitive

### **4. Structure Validation:**
- ✅ **Minimum Rows**: At least one data row required
- ✅ **Header Row**: Must have header row
- ✅ **Data Format**: Proper Excel format

## 🎯 **Error Handling**

### **Error Types:**
1. **Structure Errors**: Missing headers, invalid format
2. **Content Errors**: Invalid data types, missing required fields
3. **Duplicate Errors**: Duplicate shipment IDs
4. **Format Errors**: Invalid date format, negative numbers

### **Error Severity:**
- **Error**: Critical issues that prevent processing
- **Warning**: Issues that should be addressed but don't block processing

### **Error Messages:**
- Clear, specific error messages
- Row number identification
- Field-specific error details
- Suggested fixes

## 🚀 **Benefits**

### **1. Data Quality:**
- **Comprehensive Validation**: All aspects of Excel data validated
- **Error Prevention**: Catch issues before processing
- **Data Consistency**: Ensure proper format and structure
- **Duplicate Prevention**: Avoid data conflicts

### **2. User Experience:**
- **Clear Feedback**: Specific error messages with row numbers
- **Visual Indicators**: Error highlighting in Excel viewer
- **Auto Fix**: Automatic error correction where possible
- **Manual Edit**: Inline editing for user corrections

### **3. Technical Advantages:**
- **Excel Native**: Direct Excel file processing
- **Type Safety**: Proper TypeScript validation
- **Performance**: Efficient validation algorithms
- **Scalability**: Handle large Excel files

## 🎉 **Complete Validation Workflow**

1. **Upload** → Excel file uploaded
2. **Structure Check** → Validate headers and format
3. **Content Check** → Validate data types and required fields
4. **Duplicate Check** → Check for duplicate shipment IDs
5. **Error Display** → Show validation errors in viewer
6. **Auto Fix** → Apply automatic corrections
7. **Manual Edit** → Allow user corrections
8. **Download** → Export corrected file
9. **Proceed** → Continue to container planning

The Excel validation is now comprehensive and ensures data quality throughout the process! 🎉
