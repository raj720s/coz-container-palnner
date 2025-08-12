// Data service for managing POL and POD ports
export interface POLPort {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  isActive: boolean;
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
  createdAt: string;
  updatedAt: string;
}

// Mock data for POL ports
const mockPOLPorts: POLPort[] = [
  {
    id: "1",
    code: "SHA",
    name: "Shanghai",
    country: "China",
    region: "Asia",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "2",
    code: "YTN",
    name: "Yantian",
    country: "China",
    region: "Asia",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "3",
    code: "QDG",
    name: "Qingdao",
    country: "China",
    region: "Asia",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "4",
    code: "NGB",
    name: "Ningbo",
    country: "China",
    region: "Asia",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "5",
    code: "TJS",
    name: "Tianjin",
    country: "China",
    region: "Asia",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "6",
    code: "DLC",
    name: "Dalian",
    country: "China",
    region: "Asia",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  }
];

// Mock data for POD ports
const mockPODPorts: PODPort[] = [
  {
    id: "1",
    code: "HAL",
    name: "HALDENSLEBEN",
    country: "Germany",
    region: "Europe",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "2",
    code: "PEI",
    name: "PEINE",
    country: "Germany",
    region: "Europe",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "3",
    code: "ROT",
    name: "ROTTENDORF",
    country: "Germany",
    region: "Europe",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "4",
    code: "APF",
    name: "APFELSTÄDT",
    country: "Germany",
    region: "Europe",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "5",
    code: "WIT",
    name: "WITTENBERGE",
    country: "Germany",
    region: "Europe",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "6",
    code: "LAN",
    name: "LANGENSELBOLD",
    country: "Germany",
    region: "Europe",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  }
];

class DataService {
  // POL Ports
  async getPOLPorts(): Promise<POLPort[]> {
    // In a real app, this would fetch from an API
    // For now, return mock data
    return Promise.resolve([...mockPOLPorts]);
  }

  async createPOLPort(portData: Omit<POLPort, 'id' | 'createdAt' | 'updatedAt'>): Promise<POLPort> {
    const newPort: POLPort = {
      ...portData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockPOLPorts.push(newPort);
    return Promise.resolve(newPort);
  }

  async updatePOLPort(id: string, portData: Partial<POLPort>): Promise<POLPort> {
    const index = mockPOLPorts.findIndex(port => port.id === id);
    if (index === -1) {
      throw new Error('POL Port not found');
    }
    
    mockPOLPorts[index] = {
      ...mockPOLPorts[index],
      ...portData,
      updatedAt: new Date().toISOString()
    };
    
    return Promise.resolve(mockPOLPorts[index]);
  }

  async deletePOLPort(id: string): Promise<void> {
    const index = mockPOLPorts.findIndex(port => port.id === id);
    if (index === -1) {
      throw new Error('POL Port not found');
    }
    
    mockPOLPorts.splice(index, 1);
    return Promise.resolve();
  }

  // POD Ports
  async getPODPorts(): Promise<PODPort[]> {
    // In a real app, this would fetch from an API
    // For now, return mock data
    return Promise.resolve([...mockPODPorts]);
  }

  async createPODPort(portData: Omit<PODPort, 'id' | 'createdAt' | 'updatedAt'>): Promise<PODPort> {
    const newPort: PODPort = {
      ...portData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockPODPorts.push(newPort);
    return Promise.resolve(newPort);
  }

  async updatePODPort(id: string, portData: Partial<PODPort>): Promise<PODPort> {
    const index = mockPODPorts.findIndex(port => port.id === id);
    if (index === -1) {
      throw new Error('POD Port not found');
    }
    
    mockPODPorts[index] = {
      ...mockPODPorts[index],
      ...portData,
      updatedAt: new Date().toISOString()
    };
    
    return Promise.resolve(mockPODPorts[index]);
  }

  async deletePODPort(id: string): Promise<void> {
    const index = mockPODPorts.findIndex(port => port.id === id);
    if (index === -1) {
      throw new Error('POD Port not found');
    }
    
    mockPODPorts.splice(index, 1);
    return Promise.resolve();
  }
}

export const dataService = new DataService();

