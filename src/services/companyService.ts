import { baseService } from './baseService';
import {
  Company,
  CompanyListRequest,
  CompanyListResponse,
  CompanyCreateRequest,
  CompanyUpdateRequest,
} from '@/types/company';

const API_BASE = '/master-data/v1/company';

export const companyService = {
  // Get list of companies with pagination and filters
  async getCompanies(params: CompanyListRequest = {}): Promise<CompanyListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.company_type) queryParams.append('company_type', params.company_type.toString());
    if (params.country) queryParams.append('country', params.country);
    if (params.is_third_party !== undefined) queryParams.append('is_third_party', params.is_third_party.toString());
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.order_by) queryParams.append('order_by', params.order_by);
    if (params.order_type) queryParams.append('order_type', params.order_type);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE}/list?${queryString}` : `${API_BASE}/list`;
    
    return baseService.post(url, {});
  },

  // Get single company by ID
  async getCompany(id: number): Promise<Company> {
    return baseService.get(`${API_BASE}/${id}`);
  },

  // Create new company
  async createCompany(data: CompanyCreateRequest): Promise<Company> {
    return baseService.post(API_BASE, data);
  },

  // Update company
  async updateCompany(id: number, data: CompanyUpdateRequest): Promise<Company> {
    return baseService.put(`${API_BASE}/${id}`, data);
  },

  // Partial update company
  async partialUpdateCompany(id: number, data: Partial<CompanyUpdateRequest>): Promise<Company> {
    return baseService.patch(`${API_BASE}/${id}`, data);
  },

  // Delete company
  async deleteCompany(id: number): Promise<void> {
    return baseService.delete(`${API_BASE}/${id}`);
  },

  // Export companies to CSV
  async exportCompanies(params: CompanyListRequest = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.company_type) queryParams.append('company_type', params.company_type.toString());
    if (params.country) queryParams.append('country', params.country);
    if (params.is_third_party !== undefined) queryParams.append('is_third_party', params.is_third_party.toString());
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.order_by) queryParams.append('order_by', params.order_by);
    if (params.order_type) queryParams.append('order_type', params.order_type);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE}/export?${queryString}` : `${API_BASE}/export`;
    
    return baseService.get(url, {
      responseType: 'blob',
    });
  },
};
