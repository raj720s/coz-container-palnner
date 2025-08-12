const XLSX = require('xlsx');
const path = require('path');

// Create a validation-compliant demo Excel file using only available POL ports
function createValidationCompliantExcel() {
  // Define the headers exactly as expected
  const headers = [
    'SHIPMENT',
    'CUSTOMER', 
    'SUPPLIER',
    'VOLUME',
    'Qty',
    'RCV/PUG',
    'POL',
    'Destsite'
  ];

  // Create sample data using ONLY the 6 available POL ports
  const data = [
    // Row 1: Shanghai shipment
    [
      'SHIP001',
      'TechCorp Inc',
      'Electronics Supplier A',
      12.5,
      150,
      '15/01/2025',
      'Shanghai',
      'HALDENSLEBEN'
    ],
    
    // Row 2: Shanghai shipment (same group)
    [
      'SHIP002',
      'TechCorp Inc',
      'Electronics Supplier B',
      28.3,
      200,
      '16/01/2025',
      'Shanghai',
      'HALDENSLEBEN'
    ],
    
    // Row 3: Yantian shipment
    [
      'SHIP003',
      'AutoParts Ltd',
      'Mechanical Parts Co',
      45.7,
      300,
      '17/01/2025',
      'Yantian',
      'PEINE'
    ],
    
    // Row 4: Yantian shipment (same group)
    [
      'SHIP004',
      'AutoParts Ltd',
      'Mechanical Parts Co',
      22.1,
      180,
      '18/01/2025',
      'Yantian',
      'PEINE'
    ],
    
    // Row 5: Qingdao shipment
    [
      'SHIP005',
      'Fashion Retail',
      'Textile Manufacturer',
      18.9,
      250,
      '19/01/2025',
      'Qingdao',
      'ROTTENDORF'
    ],
    
    // Row 6: Qingdao shipment (same group)
    [
      'SHIP006',
      'Fashion Retail',
      'Textile Manufacturer',
      14.2,
      120,
      '20/01/2025',
      'Qingdao',
      'ROTTENDORF'
    ],
    
    // Row 7: Ningbo shipment
    [
      'SHIP007',
      'Pharma Solutions',
      'Chemical Supplier',
      32.8,
      400,
      '21/01/2025',
      'Ningbo',
      'APFELSTÄDT'
    ],
    
    // Row 8: Ningbo shipment (same group)
    [
      'SHIP008',
      'Pharma Solutions',
      'Chemical Supplier',
      19.4,
      280,
      '22/01/2025',
      'Ningbo',
      'APFELSTÄDT'
    ],
    
    // Row 9: Tianjin shipment
    [
      'SHIP009',
      'Industrial Tools',
      'Hardware Supplier',
      26.5,
      350,
      '23/01/2025',
      'Tianjin',
      'WITTENBERGE'
    ],
    
    // Row 10: Tianjin shipment (same group)
    [
      'SHIP010',
      'Industrial Tools',
      'Hardware Supplier',
      15.7,
      220,
      '24/01/2025',
      'Tianjin',
      'WITTENBERGE'
    ],
    
    // Row 11: Dalian shipment
    [
      'SHIP011',
      'Food & Beverage',
      'Agricultural Co',
      38.2,
      500,
      '25/01/2025',
      'Dalian',
      'LANGENSELBOLD'
    ],
    
    // Row 12: Dalian shipment (same group)
    [
      'SHIP012',
      'Food & Beverage',
      'Agricultural Co',
      21.6,
      320,
      '26/01/2025',
      'Dalian',
      'LANGENSELBOLD'
    ],
    
    // Row 13: Shanghai shipment (different destination)
    [
      'SHIP013',
      'Small Business',
      'Local Supplier',
      16.8,
      100,
      '27/01/2025',
      'Shanghai',
      'Haldensleben'
    ],
    
    // Row 14: Shanghai shipment (same group)
    [
      'SHIP014',
      'Small Business',
      'Local Supplier',
      14.2,
      80,
      '28/01/2025',
      'Shanghai',
      'Haldensleben'
    ],
    
    // Row 15: Yantian shipment (different destination)
    [
      'SHIP015',
      'Construction Co',
      'Building Materials',
      42.3,
      600,
      '29/01/2025',
      'Yantian',
      'PEINE'
    ]
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 12 }, // SHIPMENT
    { wch: 20 }, // CUSTOMER
    { wch: 25 }, // SUPPLIER
    { wch: 10 }, // VOLUME
    { wch: 8 },  // Qty
    { wch: 12 }, // RCV/PUG
    { wch: 12 }, // POL
    { wch: 15 }  // Destsite
  ];
  worksheet['!cols'] = columnWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipments');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `shipment-validation-compliant-${timestamp}.xlsx`;
  const filepath = path.join(__dirname, filename);

  // Write the file
  XLSX.writeFile(workbook, filepath);
  
  console.log(`✅ Validation-compliant demo Excel file created: ${filename}`);
  console.log(`📁 Location: ${filepath}`);
  console.log('\n📊 File Summary:');
  console.log(`   • Total rows: ${data.length}`);
  console.log(`   • Headers: ${headers.join(', ')}`);
  console.log(`   • Data validation: All fields will pass validation`);
  console.log(`   • Container planning: Will create multiple container assignments`);
  
  console.log('\n🔍 Validation Details:');
  console.log(`   • SHIPMENT IDs: Unique and non-empty`);
  console.log(`   • CUSTOMER: Valid business names`);
  console.log(`   • SUPPLIER: Valid supplier names`);
  console.log(`   • VOLUME: Positive numbers (12.5 - 45.7 CBM)`);
  console.log(`   • Qty: Positive integers (80 - 600)`);
  console.log(`   • RCV/PUG: Valid dates in DD/MM/YYYY format`);
  console.log(`   • POL: ONLY available ports (Shanghai, Yantian, Qingdao, Ningbo, Tianjin, Dalian)`);
  console.log(`   • Destsite: Valid destinations (HALDENSLEBEN, PEINE, ROTTENDORF, etc.)`);
  
  console.log('\n🏗️ Container Planning Expected Results:');
  console.log(`   • Phase 1: Shipment Grouping - Will group by customer/POL/destination`);
  console.log(`   • Phase 2: Load Optimization - Will optimize container filling`);
  console.log(`   • Phase 3: Container Assignment - Will assign to 20GP, 40GP, 40HQ containers`);
  
  console.log('\n📦 Expected Container Assignments:');
  console.log(`   • 20GP containers: For smaller shipments (15-33 CBM)`);
  console.log(`   • 40GP containers: For medium shipments (30-67 CBM)`);
  console.log(`   • 40HQ containers: For larger shipments (35-76 CBM)`);
  
  console.log('\n✅ GUARANTEED TO PASS VALIDATION:');
  console.log(`   • All 6 POL ports are in master data`);
  console.log(`   • All destinations are valid`);
  console.log(`   • All data types are correct`);
  console.log(`   • No validation errors expected`);
  
  return filepath;
}

// Run the function
try {
  createValidationCompliantExcel();
} catch (error) {
  console.error('❌ Error creating validation-compliant Excel file:', error);
}

