// Shipment Order Types and Interfaces

export interface ShipmentOrder {
  id?: string;
  so_number: string; // VBK + YY + MM + DD + 3-digit counter
  status: ShipmentOrderStatus;
  shipper: string;
  consignee: string;
  transportation_mode: TransportationMode;
  cargo_readiness_date: string; // ISO date string
  service_type: ServiceType;
  volume: number;
  weight: number;
  hs_code?: string;
  cargo_description?: string;
  marks_numbers?: string;
  customer_reference?: string;
  cargo_type?: CargoType;
  dangerous_goods_notes?: string;
  place_of_receipt?: string;
  port_of_loading: string;
  port_of_discharge: string;
  place_of_delivery?: string;
  carrier?: string;
  carrier_booking_number?: string;
  equipment_count: number;
  equipment_size_type: string;
  equipment_numbers: string[];
  // Dynamic fields (5 user-defined fields)
  user_defined_field1?: string;
  user_defined_field2?: string;
  user_defined_field3?: string;
  user_defined_field4?: string;
  user_defined_field5?: string;
  // Master data references
  customer_id: string;
  vendor_id: string;
  origin_partner_id: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export type ShipmentOrderStatus = 'Draft' | 'Confirmed' | 'Shipped';
export type TransportationMode = 'FCL' | 'LCL';
export type ServiceType = 'CFS' | 'CY';
export type CargoType = 'Normal' | 'Reefer' | 'Dangerous Goods';

export interface ShipmentOrderResponse extends ShipmentOrder {
  id: string;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  customer_name?: string;
  vendor_name?: string;
  origin_partner_name?: string;
}

export interface ShipmentOrderListRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: ShipmentOrderStatus;
  customer_id?: string;
  vendor_id?: string;
  transportation_mode?: TransportationMode;
  service_type?: ServiceType;
  cargo_type?: CargoType;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateShipmentOrderRequest extends Omit<ShipmentOrder, 'id' | 'so_number' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {}

export interface UpdateShipmentOrderRequest extends Partial<CreateShipmentOrderRequest> {
  id: string;
}

export interface ShipmentOrderListResponse {
  data: ShipmentOrderResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Container Assignment Types
export interface ContainerAssignment {
  equipment_count: number;
  equipment_size_type: string;
  equipment_numbers: string[];
}

// Customer Dynamic Fields (from localStorage)
export interface CustomerDynamicField {
  id: string;
  label: string;
  value: string;
}

// Master Data References
export interface CustomerReference {
  id: string;
  name: string;
  customer_code: string;
}

export interface VendorReference {
  id: string;
  name: string;
  vendor_code: string;
}

export interface OriginPartnerReference {
  id: string;
  name: string;
  partner_code: string;
}

// Form Data Types
export interface ShipmentOrderFormData {
  // Basic Information
  shipper: string;
  consignee: string;
  transportation_mode: TransportationMode;
  cargo_readiness_date: string;
  service_type: ServiceType;
  volume: number;
  weight: number;
  
  // Optional Cargo Details
  hs_code?: string;
  cargo_description?: string;
  marks_numbers?: string;
  customer_reference?: string;
  cargo_type?: CargoType;
  dangerous_goods_notes?: string;
  
  // Location Details
  place_of_receipt?: string;
  port_of_loading: string;
  port_of_discharge: string;
  place_of_delivery?: string;
  
  // Carrier Details
  carrier?: string;
  carrier_booking_number?: string;
  
  // Container Assignment
  equipment_count: number;
  equipment_size_type: string;
  equipment_numbers: string[];
  
  // Dynamic Fields
  user_defined_field1?: string;
  user_defined_field2?: string;
  user_defined_field3?: string;
  user_defined_field4?: string;
  user_defined_field5?: string;
  
  // Master Data References
  customer_id: string;
  vendor_id: string;
  origin_partner_id: string;
}

// Validation Schemas
export const SHIPMENT_ORDER_STATUS_OPTIONS: { value: ShipmentOrderStatus; label: string }[] = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Shipped', label: 'Shipped' }
];

export const TRANSPORTATION_MODE_OPTIONS: { value: TransportationMode; label: string }[] = [
  { value: 'FCL', label: 'FCL (Full Container Load)' },
  { value: 'LCL', label: 'LCL (Less than Container Load)' }
];

export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'CFS', label: 'CFS (Container Freight Station)' },
  { value: 'CY', label: 'CY (Container Yard)' }
];

export const CARGO_TYPE_OPTIONS: { value: CargoType; label: string }[] = [
  { value: 'Normal', label: 'Normal' },
  { value: 'Reefer', label: 'Reefer' },
  { value: 'Dangerous Goods', label: 'Dangerous Goods' }
];

export const EQUIPMENT_SIZE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '20FT', label: '20FT Standard' },
  { value: '40FT', label: '40FT Standard' },
  { value: '40FT_HC', label: '40FT High Cube' },
  { value: '45FT_HC', label: '45FT High Cube' },
  { value: '20FT_REEFER', label: '20FT Reefer' },
  { value: '40FT_REEFER', label: '40FT Reefer' },
  { value: '20FT_TANK', label: '20FT Tank' },
  { value: '40FT_TANK', label: '40FT Tank' }
];
