// Shipment Order Service
import { 
  ShipmentOrderResponse, 
  CreateShipmentOrderRequest,
  UpdateShipmentOrderRequest,
  ShipmentOrderStatus,
  CustomerReference,
  VendorReference,
  OriginPartnerReference,
  ShipmentListRequest,
  ShipmentListApiResponse
} from '@/types/shipmentOrder';
import superAxios from '@/utils/superAxios';
import { BASEURL } from '@/config/variables';

class ShipmentOrderService {

  // Get list of shipment orders with filtering and pagination
  async listShipmentOrders(request: ShipmentListRequest): Promise<ShipmentListApiResponse> {
    const response = await superAxios.post(`${BASEURL}/shipment/api/list`, request);
    return response.data;
  }

  // Get single shipment order by ID
  async getShipmentOrder(id: number): Promise<ShipmentOrderResponse> {
    const response = await superAxios.get(`${BASEURL}/shipment/api/shipment/${id}`);
    return response.data;
  }

  // Create new shipment order
  async createShipmentOrder(data: CreateShipmentOrderRequest): Promise<ShipmentOrderResponse> {
    const response = await superAxios.post(`${BASEURL}/shipment/api/shipment`, data);
    return response.data;
  }

  // Update existing shipment order (full update)
  async updateShipmentOrder(id: number, data: UpdateShipmentOrderRequest): Promise<ShipmentOrderResponse> {
    const response = await superAxios.put(`${BASEURL}/shipment/api/shipment/${id}`, data);
    return response.data;
  }

  // Partial update shipment order
  async partialUpdateShipmentOrder(id: number, data: Partial<UpdateShipmentOrderRequest>): Promise<ShipmentOrderResponse> {
    const response = await superAxios.patch(`${BASEURL}/shipment/api/shipment/${id}`, data);
    return response.data;
  }

  // Update shipment order status (using partial update)
  async updateShipmentOrderStatus(id: number, status: ShipmentOrderStatus): Promise<ShipmentOrderResponse> {
    return this.partialUpdateShipmentOrder(id, { vendor_booking_status: status });
  }

  // Delete shipment order
  async deleteShipmentOrder(id: number): Promise<void> {
    await superAxios.delete(`${BASEURL}/shipment/api/shipment/${id}`);
  }

  // Get customers for dropdown
  async getCustomers(): Promise<CustomerReference[]> {
    const response = await superAxios.get(`${BASEURL}/customers/short-list`);
    return response.data;
  }

  // Get vendors for dropdown
  async getVendors(): Promise<VendorReference[]> {
    const response = await superAxios.get(`${BASEURL}/vendors/short-list`);
    return response.data;
  }

  // Get origin partners for dropdown
  async getOriginPartners(): Promise<OriginPartnerReference[]> {
    const response = await superAxios.get(`${BASEURL}/origin-partners/short-list`);
    return response.data;
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
    if (!data.cargo_readiness_date) errors.push('Cargo readiness date is required');
    if (!data.service_type) errors.push('Service type is required');
    if (!data.volume || data.volume <= 0) errors.push('Volume must be greater than 0');
    if (!data.weight || data.weight <= 0) errors.push('Weight must be greater than 0');
    if (!data.hs_code?.trim()) errors.push('HS Code is required');
    if (!data.customer) errors.push('Customer is required');

    // Dangerous goods validation
    if (data.cargo_type === 'dg' && !data.dangerous_goods_notes?.trim()) {
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
