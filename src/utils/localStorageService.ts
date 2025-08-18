/**
 * LocalStorage-based Data Service
 * Handles all data operations using browser localStorage instead of file system
 */

// Storage Keys
const STORAGE_KEYS = {
  CONTAINER_PRIORITIES: 'nxt_admin_container_priorities',
  CONTAINER_THRESHOLDS: 'nxt_admin_container_thresholds',
  POL_PORTS: 'nxt_admin_pol_ports',
  POD_PORTS: 'nxt_admin_pod_ports',
  UPLOADED_FILES: 'nxt_admin_uploaded_files',
  SHIPMENT_DATA: 'nxt_admin_shipment_data',
  CONTAINER_PLANNING_RESULTS: 'nxt_admin_container_planning_results',
  FILE_COUNTER: 'nxt_admin_file_counter'
} as const;

// Types
export interface ValidationError {
  rowNumber: number;
  field: string;
  errorMessage: string;
  value: string;
  severity: "error" | "warning";
}

export interface ContainerPriority {
  id: string;
  containerType: string;
  priority: number;
  status: 'active' | 'inactive';
  description: string;
  specifications: {
    length: number;
    width: number;
    height: number;
    maxCBM: number;
    maxWeight: number;
    groupMixRules?: {
      maxDestinations: number;
      minCBMPerDestination: number;
      allowedDestinationTypes: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContainerThreshold {
  id: string;
  containerType: string;
  minCBM: number;
  maxCBM: number;
  pol?: string;
  isDefault: boolean;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface POLPort {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  isActive: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  portDetails: {
    timezone: string;
    operatingHours: string;
    maxDraft: number;
    capacity: string;
    facilities: string[];
  };
  shippingLines: string[];
  averageTransitDays: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface PODPort {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  isActive: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  portDetails: {
    timezone: string;
    operatingHours: string;
    maxDraft: number;
    capacity: string;
    facilities: string[];
  };
  shippingLines: string[];
  destinationDetails: {
    mainMarkets: string[];
    railConnections: string[];
    averageDeliveryDays: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  storedName: string;
  uploadDate: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  fileContent: string; // Base64 encoded file content
  shipmentIds: string[]; // For duplicate checking
  errors?: ValidationError[]; // Validation errors
  warnings?: ValidationError[]; // Validation warnings
}

export interface ShipmentData {
  id: string;
  shipmentId: string;
  customer: string;
  supplier: string;
  volume: number;
  qty: number;
  rcvPug: string;
  pol: string;
  destsite: string;
  fileId: string;
  uploadDate: string;
  [key: string]: string | number | boolean | Record<string, any> | undefined;
}

export interface ContainerPlanningResult {
  id: string;
  fileId: string;
  planDate: string;
  assignments: ContainerAssignment[];
  summary: {
    totalShipments: number;
    assignedShipments: number;
    unassignedShipments: number;
    totalContainers: number;
    containerTypes: Record<string, number>;
  };
}

export interface ContainerAssignment {
  shipmentId: string;
  containerRef: string;
  containerType: string;
  volume: number;
  qty: number;
  totalCBM: number;
  totalQty: number;
  priority: number;
  customer: string;
  pol: string;
  pod: string;
  status: 'assigned' | 'unassigned';
}

// Utility functions
const isClient = typeof window !== 'undefined';

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (!isClient) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key ${key}:`, error);
  }
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getNextFileCounter(): number {
  if (!isClient) return 1;
  
  const counter = getFromStorage(STORAGE_KEYS.FILE_COUNTER, 0);
  const nextCounter = counter + 1;
  setToStorage(STORAGE_KEYS.FILE_COUNTER, nextCounter);
  return nextCounter;
}

// Initialize default data
function initializeDefaultData(): void {
  if (!isClient) return;

  // Initialize container priorities if not exists
  const priorities = getFromStorage(STORAGE_KEYS.CONTAINER_PRIORITIES, []);
  if (priorities.length === 0) {
    const defaultPriorities: ContainerPriority[] = [
      {
        id: "1",
        containerType: "40HQ",
        priority: 1,
        status: "active",
        description: "40-foot High Cube Container",
        specifications: {
          length: 12.032,
          width: 2.352,
          height: 2.698,
          maxCBM: 76.3,
          maxWeight: 28080
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        containerType: "40GP",
        priority: 2,
        status: "active",
        description: "40-foot Standard Container",
        specifications: {
          length: 12.032,
          width: 2.352,
          height: 2.385,
          maxCBM: 67.5,
          maxWeight: 28080
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "3",
        containerType: "20GP",
        priority: 3,
        status: "active",
        description: "20-foot Standard Container",
        specifications: {
          length: 5.898,
          width: 2.352,
          height: 2.385,
          maxCBM: 33.1,
          maxWeight: 21600
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setToStorage(STORAGE_KEYS.CONTAINER_PRIORITIES, defaultPriorities);
  }

  // Initialize container thresholds if not exists
  const thresholds = getFromStorage(STORAGE_KEYS.CONTAINER_THRESHOLDS, []);
  if (thresholds.length === 0) {
    const defaultThresholds: ContainerThreshold[] = [
      {
        id: "1",
        containerType: "40HQ",
        minCBM: 35,
        maxCBM: 76,
        isDefault: true,
        isActive: true,
        description: "Default threshold for 40HQ containers",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        containerType: "40GP",
        minCBM: 30,
        maxCBM: 67,
        isDefault: true,
        isActive: true,
        description: "Default threshold for 40GP containers",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "3",
        containerType: "20GP",
        minCBM: 15,
        maxCBM: 33,
        isDefault: true,
        isActive: true,
        description: "Default threshold for 20GP containers",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setToStorage(STORAGE_KEYS.CONTAINER_THRESHOLDS, defaultThresholds);
  }

  // Initialize POL ports if not exists
  const polPorts = getFromStorage(STORAGE_KEYS.POL_PORTS, []);
  if (polPorts.length === 0) {
    const defaultPOLPorts: POLPort[] = [
      {
        id: "1",
        code: "CNSHA",
        name: "Shanghai",
        country: "China",
        region: "Asia Pacific",
        isActive: true,
        coordinates: { latitude: 31.2304, longitude: 121.4737 },
        portDetails: {
          timezone: "Asia/Shanghai",
          operatingHours: "24/7",
          maxDraft: 15.5,
          capacity: "TEU/year: 47,030,000",
          facilities: ["Container Terminal", "Ro-Ro Terminal", "Bulk Terminal"]
        },
        shippingLines: ["COSCO", "OOCL", "Evergreen", "CMA CGM", "MSC"],
        averageTransitDays: { "USLAX": 14, "NLRTM": 28, "DEHAM": 32 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        code: "CNYTN",
        name: "Yantian",
        country: "China",
        region: "Asia Pacific",
        isActive: true,
        coordinates: { latitude: 22.5833, longitude: 114.2167 },
        portDetails: {
          timezone: "Asia/Shanghai",
          operatingHours: "24/7",
          maxDraft: 16.5,
          capacity: "TEU/year: 13,770,000",
          facilities: ["Container Terminal", "International Terminal"]
        },
        shippingLines: ["COSCO", "MSC", "CMA CGM", "Hapag-Lloyd"],
        averageTransitDays: { "USLAX": 15, "NLRTM": 29, "DEHAM": 33 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "3",
        code: "CNTAO",
        name: "Qingdao",
        country: "China",
        region: "Asia Pacific",
        isActive: true,
        coordinates: { latitude: 36.0986, longitude: 120.3719 },
        portDetails: {
          timezone: "Asia/Shanghai",
          operatingHours: "24/7",
          maxDraft: 20.0,
          capacity: "TEU/year: 24,030,000",
          facilities: ["Container Terminal", "Ore Terminal", "Oil Terminal"]
        },
        shippingLines: ["COSCO", "Yang Ming", "Evergreen", "K Line", "MSC"],
        averageTransitDays: { "USLAX": 16, "NLRTM": 30, "DEHAM": 34 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "4",
        code: "CNNGB",
        name: "Ningbo",
        country: "China",
        region: "Asia Pacific",
        isActive: true,
        coordinates: { latitude: 29.8683, longitude: 121.5440 },
        portDetails: {
          timezone: "Asia/Shanghai",
          operatingHours: "24/7",
          maxDraft: 18.0,
          capacity: "TEU/year: 33,350,000",
          facilities: ["Container Terminal", "Bulk Terminal", "Oil Terminal"]
        },
        shippingLines: ["COSCO", "MSC", "CMA CGM", "Evergreen", "Yang Ming"],
        averageTransitDays: { "USLAX": 17, "NLRTM": 31, "DEHAM": 35 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "5",
        code: "CNTXG",
        name: "Tianjin",
        country: "China",
        region: "Asia Pacific",
        isActive: true,
        coordinates: { latitude: 39.0842, longitude: 117.2009 },
        portDetails: {
          timezone: "Asia/Shanghai",
          operatingHours: "24/7",
          maxDraft: 19.5,
          capacity: "TEU/year: 20,350,000",
          facilities: ["Container Terminal", "Bulk Terminal", "Chemical Terminal"]
        },
        shippingLines: ["COSCO", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE"],
        averageTransitDays: { "USLAX": 18, "NLRTM": 32, "DEHAM": 36 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "6",
        code: "CNDLC",
        name: "Dalian",
        country: "China",
        region: "Asia Pacific",
        isActive: true,
        coordinates: { latitude: 38.9140, longitude: 121.6147 },
        portDetails: {
          timezone: "Asia/Shanghai",
          operatingHours: "24/7",
          maxDraft: 17.5,
          capacity: "TEU/year: 10,120,000",
          facilities: ["Container Terminal", "Bulk Terminal", "Oil Terminal"]
        },
        shippingLines: ["COSCO", "MSC", "CMA CGM", "Hapag-Lloyd"],
        averageTransitDays: { "USLAX": 19, "NLRTM": 33, "DEHAM": 37 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setToStorage(STORAGE_KEYS.POL_PORTS, defaultPOLPorts);
  }

  // Initialize POD ports if not exists
  const podPorts = getFromStorage(STORAGE_KEYS.POD_PORTS, []);
  if (podPorts.length === 0) {
    const defaultPODPorts: PODPort[] = [
      {
        id: "1",
        code: "DEHAM",
        name: "Hamburg",
        country: "Germany",
        region: "Europe",
        isActive: true,
        coordinates: { latitude: 53.5511, longitude: 9.9937 },
        portDetails: {
          timezone: "Europe/Berlin",
          operatingHours: "24/7",
          maxDraft: 15.1,
          capacity: "TEU/year: 8,470,000",
          facilities: ["Container Terminal", "Multipurpose Terminal", "Passenger Terminal"]
        },
        shippingLines: ["Hapag-Lloyd", "MSC", "Maersk", "CMA CGM", "Yang Ming"],
        destinationDetails: {
          mainMarkets: ["Germany", "Austria", "Czech Republic", "Poland"],
          railConnections: ["DB Cargo", "PKP Cargo"],
          averageDeliveryDays: { "Germany": 1, "Austria": 2, "Czech Republic": 2, "Poland": 3 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        code: "NLRTM",
        name: "Rotterdam",
        country: "Netherlands",
        region: "Europe",
        isActive: true,
        coordinates: { latitude: 51.9244, longitude: 4.4777 },
        portDetails: {
          timezone: "Europe/Amsterdam",
          operatingHours: "24/7",
          maxDraft: 24.0,
          capacity: "TEU/year: 15,280,000",
          facilities: ["Container Terminal", "Chemical Terminal", "Breakbulk Terminal"]
        },
        shippingLines: ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE"],
        destinationDetails: {
          mainMarkets: ["Netherlands", "Germany", "Belgium", "Switzerland"],
          railConnections: ["DB Cargo", "Rail Cargo Group"],
          averageDeliveryDays: { "Netherlands": 1, "Germany": 2, "Belgium": 1, "Switzerland": 3 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setToStorage(STORAGE_KEYS.POD_PORTS, defaultPODPorts);
  }
}

// Main service
export const localStorageService = {
  // Initialize
  init() {
    initializeDefaultData();
  },

  // Container Priorities
  getContainerPriorities(): ContainerPriority[] {
    return getFromStorage(STORAGE_KEYS.CONTAINER_PRIORITIES, []);
  },

  getActiveContainerPriorities(): ContainerPriority[] {
    const priorities = this.getContainerPriorities();
    return priorities.filter(p => p.status === 'active').sort((a, b) => a.priority - b.priority);
  },

  getContainerPriorityById(id: string): ContainerPriority | null {
    const priorities = this.getContainerPriorities();
    return priorities.find(p => p.id === id) || null;
  },

  saveContainerPriority(priority: Omit<ContainerPriority, 'id' | 'createdAt' | 'updatedAt'>): ContainerPriority {
    const priorities = this.getContainerPriorities();
    const newPriority: ContainerPriority = {
      ...priority,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    priorities.push(newPriority);
    setToStorage(STORAGE_KEYS.CONTAINER_PRIORITIES, priorities);
    return newPriority;
  },

  updateContainerPriority(id: string, updates: Partial<ContainerPriority>): ContainerPriority | null {
    const priorities = this.getContainerPriorities();
    const index = priorities.findIndex(p => p.id === id);
    if (index === -1) return null;

    priorities[index] = {
      ...priorities[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.CONTAINER_PRIORITIES, priorities);
    return priorities[index];
  },

  deleteContainerPriority(id: string): boolean {
    const priorities = this.getContainerPriorities();
    const filtered = priorities.filter(p => p.id !== id);
    if (filtered.length === priorities.length) return false;
    setToStorage(STORAGE_KEYS.CONTAINER_PRIORITIES, filtered);
    return true;
  },

  // Container Thresholds
  getContainerThresholds(): ContainerThreshold[] {
    return getFromStorage(STORAGE_KEYS.CONTAINER_THRESHOLDS, []);
  },

  getThresholdsByContainerType(containerType: string): ContainerThreshold[] {
    const thresholds = this.getContainerThresholds();
    return thresholds.filter(t => t.containerType === containerType && t.isActive);
  },

  getThresholdByContainerTypeAndPOL(containerType: string, pol: string): ContainerThreshold | null {
    const thresholds = this.getContainerThresholds();
    
    // First look for POL-specific threshold
    let threshold = thresholds.find(t => 
      t.containerType === containerType && 
      t.pol === pol && 
      t.isActive
    );
    
    // If not found, look for default threshold
    if (!threshold) {
      threshold = thresholds.find(t => 
        t.containerType === containerType && 
        t.isDefault && 
        t.isActive
      );
    }
    
    return threshold || null;
  },

  saveContainerThreshold(threshold: Omit<ContainerThreshold, 'id' | 'createdAt' | 'updatedAt'>): ContainerThreshold {
    const thresholds = this.getContainerThresholds();
    const newThreshold: ContainerThreshold = {
      ...threshold,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    thresholds.push(newThreshold);
    setToStorage(STORAGE_KEYS.CONTAINER_THRESHOLDS, thresholds);
    return newThreshold;
  },

  updateContainerThreshold(id: string, updates: Partial<ContainerThreshold>): ContainerThreshold | null {
    const thresholds = this.getContainerThresholds();
    const index = thresholds.findIndex(t => t.id === id);
    if (index === -1) return null;

    thresholds[index] = {
      ...thresholds[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.CONTAINER_THRESHOLDS, thresholds);
    return thresholds[index];
  },

  deleteContainerThreshold(id: string): boolean {
    const thresholds = this.getContainerThresholds();
    const filtered = thresholds.filter(t => t.id !== id);
    if (filtered.length === thresholds.length) return false;
    setToStorage(STORAGE_KEYS.CONTAINER_THRESHOLDS, filtered);
    return true;
  },

  // POL Ports
  getPOLPorts(): POLPort[] {
    return getFromStorage(STORAGE_KEYS.POL_PORTS, []);
  },

  getActivePOLPorts(): POLPort[] {
    const ports = this.getPOLPorts();
    return ports.filter(p => p.isActive);
  },

  getPOLPortByCode(code: string): POLPort | null {
    const ports = this.getPOLPorts();
    return ports.find(p => p.code === code) || null;
  },

  savePOLPort(port: Omit<POLPort, 'id' | 'createdAt' | 'updatedAt'>): POLPort {
    const ports = this.getPOLPorts();
    const newPort: POLPort = {
      ...port,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    ports.push(newPort);
    setToStorage(STORAGE_KEYS.POL_PORTS, ports);
    return newPort;
  },

  updatePOLPort(id: string, updates: Partial<POLPort>): POLPort | null {
    const ports = this.getPOLPorts();
    const index = ports.findIndex(p => p.id === id);
    if (index === -1) return null;

    ports[index] = {
      ...ports[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.POL_PORTS, ports);
    return ports[index];
  },

  deletePOLPort(id: string): boolean {
    const ports = this.getPOLPorts();
    const filtered = ports.filter(p => p.id !== id);
    if (filtered.length === ports.length) return false;
    setToStorage(STORAGE_KEYS.POL_PORTS, filtered);
    return true;
  },

  // POD Ports
  getPODPorts(): PODPort[] {
    return getFromStorage(STORAGE_KEYS.POD_PORTS, []);
  },

  getActivePODPorts(): PODPort[] {
    const ports = this.getPODPorts();
    return ports.filter(p => p.isActive);
  },

  getPODPortByCode(code: string): PODPort | null {
    const ports = this.getPODPorts();
    return ports.find(p => p.code === code) || null;
  },

  savePODPort(port: Omit<PODPort, 'id' | 'createdAt' | 'updatedAt'>): PODPort {
    const ports = this.getPODPorts();
    const newPort: PODPort = {
      ...port,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    ports.push(newPort);
    setToStorage(STORAGE_KEYS.POD_PORTS, ports);
    return newPort;
  },

  updatePODPort(id: string, updates: Partial<PODPort>): PODPort | null {
    const ports = this.getPODPorts();
    const index = ports.findIndex(p => p.id === id);
    if (index === -1) return null;

    ports[index] = {
      ...ports[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.POD_PORTS, ports);
    return ports[index];
  },

  deletePODPort(id: string): boolean {
    const ports = this.getPODPorts();
    const filtered = ports.filter(p => p.id !== id);
    if (filtered.length === ports.length) return false;
    setToStorage(STORAGE_KEYS.POD_PORTS, filtered);
    return true;
  },

  // File Management
  getUploadedFiles(): UploadedFile[] {
    return getFromStorage(STORAGE_KEYS.UPLOADED_FILES, []);
  },

  saveUploadedFile(file: Omit<UploadedFile, 'id' | 'storedName'>): UploadedFile {
    const files = this.getUploadedFiles();
    const counter = getNextFileCounter();
    const fileExt = file.originalName.split('.').pop() || 'xlsx';
    const storedName = `upload_${counter}_${Date.now()}.${fileExt}`;
    
    const newFile: UploadedFile = {
      ...file,
      id: generateId(),
      storedName
    };
    
    files.push(newFile);
    setToStorage(STORAGE_KEYS.UPLOADED_FILES, files);
    return newFile;
  },

  getUploadedFileById(id: string): UploadedFile | null {
    const files = this.getUploadedFiles();
    return files.find(f => f.id === id) || null;
  },

  deleteUploadedFile(id: string): boolean {
    const files = this.getUploadedFiles();
    const filtered = files.filter(f => f.id !== id);
    if (filtered.length === files.length) return false;
    setToStorage(STORAGE_KEYS.UPLOADED_FILES, filtered);
    
    // Also delete associated shipment data
    this.deleteShipmentDataByFileId(id);
    return true;
  },

  getAllShipmentIds(): string[] {
    const files = this.getUploadedFiles();
    const allIds: string[] = [];
    files.forEach(file => {
      allIds.push(...file.shipmentIds);
    });
    return allIds;
  },

  // Shipment Data Management
  getShipmentData(): ShipmentData[] {
    return getFromStorage(STORAGE_KEYS.SHIPMENT_DATA, []);
  },

  getShipmentDataByFileId(fileId: string): ShipmentData[] {
    const shipments = this.getShipmentData();
    return shipments.filter(s => s.fileId === fileId);
  },

  saveShipmentData(shipments: Omit<ShipmentData, 'id'>[]): ShipmentData[] {
    const existingShipments = this.getShipmentData()
    const newShipments = shipments.map((shipment: Omit<ShipmentData, 'id'>) => ({
      ...shipment,
      id: generateId()
    })) as ShipmentData[];
    
    const allShipments = [...existingShipments, ...newShipments];
    setToStorage(STORAGE_KEYS.SHIPMENT_DATA, allShipments);
    return newShipments;
  },

  deleteShipmentDataByFileId(fileId: string): boolean {
    const shipments = this.getShipmentData();
    const filtered = shipments.filter(s => s.fileId !== fileId);
    if (filtered.length === shipments.length) return false;
    setToStorage(STORAGE_KEYS.SHIPMENT_DATA, filtered);
    return true;
  },

  // Container Planning Results
  getContainerPlanningResults(): ContainerPlanningResult[] {
    return getFromStorage(STORAGE_KEYS.CONTAINER_PLANNING_RESULTS, []);
  },

  saveContainerPlanningResult(result: Omit<ContainerPlanningResult, 'id'>): ContainerPlanningResult {
    const results = this.getContainerPlanningResults();
    const newResult: ContainerPlanningResult = {
      ...result,
      id: generateId()
    };
    
    results.push(newResult);
    setToStorage(STORAGE_KEYS.CONTAINER_PLANNING_RESULTS, results);
    return newResult;
  },

  getContainerPlanningResultByFileId(fileId: string): ContainerPlanningResult | null {
    const results = this.getContainerPlanningResults();
    return results.find(r => r.fileId === fileId) || null;
  },

  deleteContainerPlanningResult(id: string): boolean {
    const results = this.getContainerPlanningResults();
    const filtered = results.filter(r => r.id !== id);
    if (filtered.length === results.length) return false;
    setToStorage(STORAGE_KEYS.CONTAINER_PLANNING_RESULTS, filtered);
    return true;
  },

  // Utility methods
  getContainerTypeOptions(): Array<{ value: string; label: string }> {
    const priorities = this.getActiveContainerPriorities();
    return priorities.map(p => ({
      value: p.containerType,
      label: p.containerType.replace('_', ' ')
    }));
  },

  getPOLOptions(): Array<{ value: string; label: string }> {
    const ports = this.getActivePOLPorts();
    return [
      { value: "", label: "Default (All POLs)" },
      ...ports.map(p => ({
        value: p.name,
        label: `${p.name} (${p.code})`
      }))
    ];
  },

  getPODOptions(): Array<{ value: string; label: string }> {
    const ports = this.getPODPorts();
    return ports.map(p => ({
      value: p.name,
      label: `${p.name} (${p.code})`
    }));
  },

  // Clear all data (for development/testing)
  clearAllData(): void {
    if (!isClient) return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Export/Import functionality
  exportData(): string {
    const data = {
      containerPriorities: this.getContainerPriorities(),
      containerThresholds: this.getContainerThresholds(),
      polPorts: this.getPOLPorts(),
      podPorts: this.getPODPorts(),
      uploadedFiles: this.getUploadedFiles(),
      shipmentData: this.getShipmentData(),
      containerPlanningResults: this.getContainerPlanningResults()
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.containerPriorities) setToStorage(STORAGE_KEYS.CONTAINER_PRIORITIES, data.containerPriorities);
      if (data.containerThresholds) setToStorage(STORAGE_KEYS.CONTAINER_THRESHOLDS, data.containerThresholds);
      if (data.polPorts) setToStorage(STORAGE_KEYS.POL_PORTS, data.polPorts);
      if (data.podPorts) setToStorage(STORAGE_KEYS.POD_PORTS, data.podPorts);
      if (data.uploadedFiles) setToStorage(STORAGE_KEYS.UPLOADED_FILES, data.uploadedFiles);
      if (data.shipmentData) setToStorage(STORAGE_KEYS.SHIPMENT_DATA, data.shipmentData);
      if (data.containerPlanningResults) setToStorage(STORAGE_KEYS.CONTAINER_PLANNING_RESULTS, data.containerPlanningResults);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
};

// Don't auto-initialize - let the LocalStorageInitializer component handle this

export default localStorageService;
