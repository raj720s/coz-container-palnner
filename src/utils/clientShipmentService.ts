import * as XLSX from 'xlsx';
import { localStorageService } from './localStorageService';

interface ValidationError {
  rowNumber: number;
  field: string;
  errorMessage: string;
  value: string;
  severity: "error" | "warning";
}

interface FileValidationResult {
  fileName: string;
  fileSize: number;
  totalRows: number;
  dataRows: any[][];
  headers: string[];
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validData: any[];
  fileValidation: FileValidationResult;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "processing" | "completed" | "error";
  error?: string;
}

/**
 * Read POL ports from localStorage (client-side)
 */
function getPOLPorts(): any[] {
  try {
    const ports = localStorageService.getPOLPorts();
    return ports || [];
  } catch (error) {
    console.error('Error reading POL ports:', error);
    return [];
  }
}

/**
 * Read POD ports from localStorage (client-side)
 */
function getPODPorts(): any[] {
  try {
    const ports = localStorageService.getPODPorts();
    return ports || [];
  } catch (error) {
    console.error('Error reading POD ports:', error);
    return [];
  }
}

/**
 * Validate file structure and headers
 */
function validateFileStructure(data: any[][], fileName: string, fileSize: number): FileValidationResult {
  const result: FileValidationResult = {
    fileName,
    fileSize,
    totalRows: data.length,
    dataRows: [],
    headers: [],
    errors: [],
    warnings: []
  };

  if (data.length === 0) {
    result.errors.push({
      rowNumber: 0,
      field: "file",
      errorMessage: "File is empty",
      value: "",
      severity: "error"
    });
    return result;
  }

  // Expected headers from demo sheet
  const expectedHeaders = ["SHIPMENT", "CUSTOMER", "SUPPLIER", "VOLUME", "Qty", "RCV/PUG", "POL", "Destsite"];
  const actualHeaders = data[0] || [];
  
  // Handle potential typo in header (CUSTOME vs CUSTOMER)
  const normalizedHeaders = actualHeaders.map(header => {
    const headerStr = header != null ? header.toString() : '';
    if (headerStr === "CUSTOME") {
      result.warnings.push({
        rowNumber: 1,
        field: "CUSTOME",
        errorMessage: "Header 'CUSTOME' should be 'CUSTOMER' (typo detected)",
        value: headerStr,
        severity: "warning"
      });
      return "CUSTOMER";
    }
    return headerStr;
  });

  result.headers = normalizedHeaders;
  
  // Check for missing required headers
  const missingHeaders = expectedHeaders.filter(expected => 
    !normalizedHeaders.includes(expected)
  );
  
  if (missingHeaders.length > 0) {
    result.errors.push({
      rowNumber: 1,
      field: "headers",
      errorMessage: `Missing required headers: ${missingHeaders.join(', ')}`,
      value: normalizedHeaders.join(', '),
      severity: "error"
    });
  }

  // Check for extra headers
  const extraHeaders = normalizedHeaders.filter(header => 
    !expectedHeaders.includes(header) && header.toString().trim() !== ''
  );
  
  if (extraHeaders.length > 0) {
    result.warnings.push({
      rowNumber: 1,
      field: "headers",
      errorMessage: `Extra headers found: ${extraHeaders.join(', ')}`,
      value: normalizedHeaders.join(', '),
      severity: "warning"
    });
  }

  // Extract data rows (skip header)
  result.dataRows = data.slice(1);
  
  return result;
}

/**
 * Validate individual shipment data row
 */
function validateShipmentData(data: any[], headers: string[], rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Map data based on headers and ensure all values are strings
  const rowData: { [key: string]: string } = {};
  headers.forEach((header, index) => {
    const value = data[index];
    
    // Special handling for RCV/PUG date field - convert Excel serial date
    if (header === 'RCV/PUG' && value != null && typeof value === 'number') {
      // Excel serial date conversion: Excel epoch starts from 1900-01-01 (with leap year bug)
      const excelEpoch = new Date(1900, 0, 1);
      const daysOffset = value - 2; // Adjust for Excel's leap year bug (1900 was not a leap year)
      const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      
      // Format as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      rowData[header] = `${day}/${month}/${year}`;
    } else {
      // Convert all other values to strings to handle Excel number/date cells
      rowData[header] = value != null ? value.toString() : '';
    }
  });

  // Skip empty rows (all fields empty or only commas)
  const isEmptyRow = Object.values(rowData).every(value => !value || !value.toString().trim());
  if (isEmptyRow) {
    return errors; // Return empty errors for empty rows
  }

  // Get master data from localStorage (client-side)
  const polPorts = getPOLPorts();
  const podPorts = getPODPorts();
  
  // Extract valid POL and POD names from master data
  const validPOLs = polPorts.map(port => port.name);
  const validPODs = podPorts.map(port => port.name);
  
  // Add destination sites from demo data
  const validDestinations = [...validPODs, "HALDENSLEBEN", "Haldensleben", "PEINE", "ROTTENDORF", "APFELSTÄDT", "WITTENBERGE", "LANGENSELBOLD"];

  // 1. Validate SHIPMENT (mandatory)
  if (!rowData['SHIPMENT'] || !rowData['SHIPMENT'].trim()) {
    errors.push({
      rowNumber,
      field: "SHIPMENT",
      errorMessage: "Shipment ID is required",
      value: rowData['SHIPMENT'] || "",
      severity: "error"
    });
  }

  // 2. Validate CUSTOMER (mandatory)
  if (!rowData['CUSTOMER'] || !rowData['CUSTOMER'].trim()) {
    errors.push({
      rowNumber,
      field: "CUSTOMER",
      errorMessage: "Customer is required",
      value: rowData['CUSTOMER'] || "",
      severity: "error"
    });
  }

  // 3. Validate SUPPLIER (mandatory)
  if (!rowData['SUPPLIER'] || !rowData['SUPPLIER'].trim()) {
    errors.push({
      rowNumber,
      field: "SUPPLIER",
      errorMessage: "Supplier is required",
      value: rowData['SUPPLIER'] || "",
      severity: "error"
    });
  }

  // 4. Validate VOLUME (mandatory, must be numeric)
  if (!rowData['VOLUME'] || !rowData['VOLUME'].toString().trim()) {
    errors.push({
      rowNumber,
      field: "VOLUME",
      errorMessage: "Volume is required",
      value: rowData['VOLUME'] || "",
      severity: "error"
    });
  } else {
    const volume = parseFloat(rowData['VOLUME'].toString().replace(',', ''));
    if (isNaN(volume) || volume <= 0) {
      errors.push({
        rowNumber,
        field: "VOLUME",
        errorMessage: "Volume must be a positive number",
        value: rowData['VOLUME'].toString(),
        severity: "error"
      });
    }
  }

  // 5. Validate Qty (mandatory, must be numeric)
  if (!rowData['Qty'] || !rowData['Qty'].toString().trim()) {
    errors.push({
      rowNumber,
      field: "Qty",
      errorMessage: "Quantity is required",
      value: rowData['Qty'] || "",
      severity: "error"
    });
  } else {
    const qty = parseInt(rowData['Qty'].toString().replace(',', ''));
    if (isNaN(qty) || qty <= 0) {
      errors.push({
        rowNumber,
        field: "Qty",
        errorMessage: "Quantity must be a positive number",
        value: rowData['Qty'].toString(),
        severity: "error"
      });
    }
  }

  // 6. Validate RCV/PUG (mandatory, date format DD/MM/YYYY)
  if (!rowData['RCV/PUG'] || !rowData['RCV/PUG'].trim()) {
    errors.push({
      rowNumber,
      field: "RCV/PUG",
      errorMessage: "RCV/PUG date is required",
      value: rowData['RCV/PUG'] || "",
      severity: "error"
    });
  } else {
    const dateValue = rowData['RCV/PUG'].trim();
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    
    if (!dateRegex.test(dateValue)) {
      errors.push({
        rowNumber,
        field: "RCV/PUG",
        errorMessage: "RCV/PUG must be in DD/MM/YYYY format",
        value: dateValue,
        severity: "error"
      });
    } else {
      // Validate actual date
      const [day, month, year] = dateValue.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        errors.push({
          rowNumber,
          field: "RCV/PUG",
          errorMessage: "RCV/PUG is not a valid date",
          value: dateValue,
          severity: "error"
        });
      }
    }
  }

  // 7. Validate POL (mandatory, must exist in master data)
  if (!rowData['POL'] || !rowData['POL'].trim()) {
    errors.push({
      rowNumber,
      field: "POL",
      errorMessage: "POL (Port of Loading) is required",
      value: rowData['POL'] || "",
      severity: "error"
    });
  } else if (!validPOLs.includes(rowData['POL'].trim())) {
    errors.push({
      rowNumber,
      field: "POL",
      errorMessage: `POL "${rowData['POL']}" is not valid. Valid POLs: ${validPOLs.join(', ')}`,
      value: rowData['POL'],
      severity: "error"
    });
  }

  // 8. Validate Destsite (mandatory, must exist in master data or be demo destination)
  if (!rowData['Destsite'] || !rowData['Destsite'].trim()) {
    errors.push({
      rowNumber,
      field: "Destsite",
      errorMessage: "Destination site is required",
      value: rowData['Destsite'] || "",
      severity: "error"
    });
  } else if (!validDestinations.includes(rowData['Destsite'].trim())) {
    errors.push({
      rowNumber,
      field: "Destsite",
      errorMessage: `Destination "${rowData['Destsite']}" is not valid. Valid destinations: ${validDestinations.join(', ')}`,
      value: rowData['Destsite'],
      severity: "error"
    });
  }

  return errors;
}

/**
 * Check for duplicate rows within the file
 */
function checkDuplicateRows(dataRows: any[][]): ValidationError[] {
  const errors: ValidationError[] = [];
  const rowMap = new Map<string, number[]>();

  dataRows.forEach((row, index) => {
    const rowString = JSON.stringify(row);
    if (rowMap.has(rowString)) {
      rowMap.get(rowString)!.push(index + 2); // +2 for header and 1-based indexing
    } else {
      rowMap.set(rowString, [index + 2]);
    }
  });

  // Find duplicates
  rowMap.forEach((rowNumbers, rowString) => {
    if (rowNumbers.length > 1) {
      errors.push({
        rowNumber: rowNumbers[0],
        field: "row",
        errorMessage: `Duplicate rows found at: ${rowNumbers.join(', ')}`,
        value: rowString,
        severity: "error"
      });
    }
  });

  return errors;
}

/**
 * Check duplicate shipment IDs across previously uploaded files
 */
function checkDuplicateShipmentsAcrossFiles(shipmentIds: string[], currentFileId: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  try {
    const existingFiles = localStorageService.getUploadedFiles();
    const allExistingShipmentIds = new Set<string>();
    
    // Collect all shipment IDs from existing files
    existingFiles.forEach(fileInfo => {
      if (fileInfo.id !== currentFileId) {
        fileInfo.shipmentIds?.forEach(id => allExistingShipmentIds.add(id));
      }
    });
    
    // Check for duplicates
    shipmentIds.forEach(shipmentId => {
      if (allExistingShipmentIds.has(shipmentId)) {
        errors.push({
          rowNumber: -1, // Cross-file duplicate
          field: "SHIPMENT",
          errorMessage: `Shipment ID "${shipmentId}" already exists in a previously uploaded file`,
          value: shipmentId,
          severity: "error"
        });
      }
    });
    
  } catch (error) {
    console.error('Error checking cross-file duplicates:', error);
  }
  
  return errors;
}

/**
 * Process Excel file client-side
 */
export async function processExcelFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ValidationResult & { fileId: string }> {
  
  const updateProgress = (progress: number, status: UploadProgress['status'], error?: string) => {
    if (onProgress) {
      onProgress({
        fileName: file.name,
        progress,
        status,
        error
      });
    }
  };

  try {
    updateProgress(10, "processing");

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload Excel files (.xlsx or .xls) only.');
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    updateProgress(25, "processing");

    // Check if file with same name already exists
    const existingFiles = localStorageService.getUploadedFiles();
    const fileExists = existingFiles.some(f => f.originalName === file.name);
    if (fileExists) {
      throw new Error(`File "${file.name}" already exists. Please rename the file and try again.`);
    }

    updateProgress(40, "processing");

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('Excel file is empty or could not be read');
    }

    updateProgress(60, "processing");

    // Validation Phase
    const validationResult: ValidationResult = {
      success: false,
      errors: [],
      warnings: [],
      validData: [],
      fileValidation: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: 0,
        dataRows: [],
        headers: [],
        errors: [],
        warnings: []
      }
    };

    // Basic file structure validation
    const fileValidation = validateFileStructure(jsonData as any[][], file.name, file.size);
    validationResult.fileValidation = fileValidation;

    // Add file validation errors
    validationResult.errors.push(...fileValidation.errors);
    validationResult.warnings.push(...fileValidation.warnings);

    updateProgress(70, "processing");

    // If critical errors exist, don't proceed with row validation
    if (fileValidation.errors.length > 0) {
      validationResult.success = false;
      updateProgress(100, "completed");
      return { ...validationResult, fileId: '' };
    }

    // Check for duplicate rows
    const duplicateRowErrors = checkDuplicateRows(fileValidation.dataRows);
    validationResult.errors.push(...duplicateRowErrors);

    updateProgress(80, "processing");

    // Row-by-row validation
    const shipmentIds = new Set<string>();
    const headers = fileValidation.headers;
    
    for (let index = 0; index < fileValidation.dataRows.length; index++) {
      const row = fileValidation.dataRows[index];
      const rowNumber = index + 2; // +1 for header, +1 for 1-based indexing
      
      const rowErrors = validateShipmentData(row, headers, rowNumber);
      
      if (rowErrors.length === 0) {
        // Row is valid, add to validData
        const rowData: { [key: string]: any } = {};
        headers.forEach((header, headerIndex) => {
          const value = row[headerIndex];
          
          // Apply same transformations as in validation
          if (header === 'RCV/PUG' && value != null && typeof value === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const daysOffset = value - 2;
            const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            rowData[header] = `${day}/${month}/${year}`;
          } else {
            rowData[header] = value != null ? value.toString() : '';
          }
        });
        
        // Skip empty rows
        const isEmptyRow = Object.values(rowData).every(value => !value || !value.toString().trim());
        if (!isEmptyRow) {
          validationResult.validData.push(rowData);
          
          // Collect shipment IDs for duplicate checking
          if (rowData['SHIPMENT']) {
            shipmentIds.add(rowData['SHIPMENT'].toString().trim());
          }
        }
      } else {
        validationResult.errors.push(...rowErrors);
      }
    }

    updateProgress(90, "processing");

    // Check for in-file duplicate shipment IDs
    const shipmentIdCounts = new Map<string, number[]>();
    validationResult.validData.forEach((data, index) => {
      const shipmentId = data['SHIPMENT'];
      if (shipmentId) {
        const rowNumber = index + 2; // Adjust for header
        if (shipmentIdCounts.has(shipmentId)) {
          shipmentIdCounts.get(shipmentId)!.push(rowNumber);
        } else {
          shipmentIdCounts.set(shipmentId, [rowNumber]);
        }
      }
    });

    // Add in-file duplicate shipment ID errors
    shipmentIdCounts.forEach((rowNumbers, shipmentId) => {
      if (rowNumbers.length > 1) {
        validationResult.errors.push({
          rowNumber: rowNumbers[0],
          field: "SHIPMENT",
          errorMessage: `Duplicate shipment ID "${shipmentId}" found in rows: ${rowNumbers.join(', ')}`,
          value: shipmentId,
          severity: "error"
        });
      }
    });

    // Save file information to localStorage
    const uploadedFile = localStorageService.saveUploadedFile({
      originalName: file.name,
      uploadDate: new Date().toISOString(),
      fileSize: file.size,
      totalRows: fileValidation.totalRows,
      validRows: validationResult.validData.length,
      invalidRows: fileValidation.totalRows - validationResult.validData.length,
      fileContent: btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))), // Convert to base64
      shipmentIds: Array.from(shipmentIds)
    });

    // Check for cross-file duplicates
    const allShipmentIds = Array.from(shipmentIds);
    const crossFileDuplicates = checkDuplicateShipmentsAcrossFiles(allShipmentIds, uploadedFile.id);
    
    // Add cross-file duplicate errors
    validationResult.errors.push(...crossFileDuplicates);

    // Set final success status
    validationResult.success = validationResult.errors.length === 0;

    // Save shipment data if validation successful
    if (validationResult.success && validationResult.validData.length > 0) {
      const shipmentData = validationResult.validData.map(data => ({
        shipmentId: data.SHIPMENT || '',
        customer: data.CUSTOMER || data.CUSTOME || '',
        supplier: data.SUPPLIER || '',
        volume: parseFloat((data.VOLUME || '0').toString().replace(',', '')) || 0,
        qty: parseInt((data.Qty || '0').toString().replace(',', '')) || 0,
        rcvPug: data['RCV/PUG'] || '',
        pol: data.POL || '',
        destsite: data.Destsite || '',
        fileId: uploadedFile.id,
        uploadDate: new Date().toISOString()
      }));
      
      localStorageService.saveShipmentData(shipmentData);
    } else if (validationResult.errors.length > 0) {
      // If there are errors, remove the uploaded file
      localStorageService.deleteUploadedFile(uploadedFile.id);
    }

    updateProgress(100, "completed");

    return {
      ...validationResult,
      fileId: uploadedFile.id
    };

  } catch (error) {
    console.error('Error processing file:', error);
    updateProgress(100, "error", error instanceof Error ? error.message : 'Failed to process file');
    throw error;
  }
}

/**
 * Get uploaded files (client-side)
 */
export function getUploadedFiles() {
  return localStorageService.getUploadedFiles();
}

/**
 * Delete uploaded file (client-side)
 */
export function deleteUploadedFile(fileId: string) {
  return localStorageService.deleteUploadedFile(fileId);
}
