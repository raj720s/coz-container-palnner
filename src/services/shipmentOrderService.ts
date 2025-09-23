// Shipment Order Service
import { 
  ShipmentOrderResponse, 
  ShipmentOrderListRequest, 
  ShipmentOrderListResponse,
  CreateShipmentOrderRequest,
  UpdateShipmentOrderRequest,
  CustomerReference,
  VendorReference,
  OriginPartnerReference
} from '@/types/shipmentOrder';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

class ShipmentOrderService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get list of shipment orders
  async getShipmentOrders(params: ShipmentOrderListRequest = {}): Promise<ShipmentOrderListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/shipment-orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ShipmentOrderListResponse>(endpoint);
  }

  // Get single shipment order by ID
  async getShipmentOrder(id: string): Promise<ShipmentOrderResponse> {
    return this.request<ShipmentOrderResponse>(`/shipment-orders/${id}`);
  }

  // Create new shipment order
  async createShipmentOrder(data: CreateShipmentOrderRequest): Promise<ShipmentOrderResponse> {
    return this.request<ShipmentOrderResponse>('/shipment-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update existing shipment order
  async updateShipmentOrder(data: UpdateShipmentOrderRequest): Promise<ShipmentOrderResponse> {
    const { id, ...updateData } = data;
    return this.request<ShipmentOrderResponse>(`/shipment-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete shipment order
  async deleteShipmentOrder(id: string): Promise<void> {
    return this.request<void>(`/shipment-orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Update shipment order status
  async updateShipmentOrderStatus(id: string, status: string): Promise<ShipmentOrderResponse> {
    return this.request<ShipmentOrderResponse>(`/shipment-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Assign container to shipment order
  async assignContainer(id: string, containerData: {
    equipment_count: number;
    equipment_size_type: string;
    equipment_numbers: string[];
  }): Promise<ShipmentOrderResponse> {
    return this.request<ShipmentOrderResponse>(`/shipment-orders/${id}/container`, {
      method: 'PATCH',
      body: JSON.stringify(containerData),
    });
  }

  // Export shipment orders
  async exportShipmentOrders(params: ShipmentOrderListRequest = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/shipment-orders/export${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Get customers for dropdown
  async getCustomers(): Promise<CustomerReference[]> {
    return this.request<CustomerReference[]>('/customers/short-list');
  }

  // Get vendors for dropdown
  async getVendors(): Promise<VendorReference[]> {
    return this.request<VendorReference[]>('/vendors/short-list');
  }

  // Get origin partners for dropdown
  async getOriginPartners(): Promise<OriginPartnerReference[]> {
    return this.request<OriginPartnerReference[]>('/origin-partners/short-list');
  }

  // Generate SO number (client-side for preview)
  generateSONumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // In a real implementation, this would be fetched from the server
    // For now, we'll use a random 3-digit number
    const counter = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `VBK${year}${month}${day}${counter}`;
  }

  // Validate shipment order data
  validateShipmentOrder(data: CreateShipmentOrderRequest): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!data.shipper?.trim()) errors.push('Shipper is required');
    if (!data.consignee?.trim()) errors.push('Consignee is required');
    if (!data.transportation_mode) errors.push('Transportation mode is required');
    if (!data.cargo_readiness_date) errors.push('Cargo readiness date is required');
    if (!data.service_type) errors.push('Service type is required');
    if (!data.volume || data.volume <= 0) errors.push('Volume must be greater than 0');
    if (!data.weight || data.weight <= 0) errors.push('Weight must be greater than 0');
    if (!data.port_of_loading?.trim()) errors.push('Port of loading is required');
    if (!data.port_of_discharge?.trim()) errors.push('Port of discharge is required');
    if (!data.equipment_count || data.equipment_count <= 0) errors.push('Equipment count must be greater than 0');
    if (!data.equipment_size_type?.trim()) errors.push('Equipment size/type is required');
    if (!data.customer_id) errors.push('Customer is required');
    if (!data.vendor_id) errors.push('Vendor is required');
    if (!data.origin_partner_id) errors.push('Origin partner is required');

    // Equipment numbers validation
    if (data.equipment_numbers.length !== data.equipment_count) {
      errors.push('Number of equipment numbers must match equipment count');
    }

    // Dangerous goods validation
    if (data.cargo_type === 'Dangerous Goods' && !data.dangerous_goods_notes?.trim()) {
      errors.push('Dangerous goods notes are required when cargo type is Dangerous Goods');
    }

    // Date validation
    if (data.cargo_readiness_date) {
      const cargoDate = new Date(data.cargo_readiness_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (cargoDate < today) {
        errors.push('Cargo readiness date cannot be in the past');
      }
    }

    return errors;
  }
}

export const shipmentOrderService = new ShipmentOrderService();
