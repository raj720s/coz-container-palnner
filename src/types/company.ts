export interface Company {
  id: number;
  name: string;
  short_name?: string;
  company_type: number;
  country?: string;
  email: string;
  phone?: string;
  parent_company?: string;
  is_third_party: boolean;
  is_active: boolean;
}

export interface CompanyFormData {
  name: string;
  short_name?: string;
  company_type: number;
  country?: string;
  email: string;
  phone?: string;
  parent_company?: string;
  is_third_party: boolean;
  is_active: boolean;
}

export interface CompanyListRequest {
  page?: number;
  page_size?: number;
  search?: string;
  company_type?: number;
  country?: string;
  is_third_party?: boolean;
  is_active?: boolean;
  order_by?: string;
  order_type?: 'asc' | 'desc';
}

export interface CompanyListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Company[];
}

export interface CompanyCreateRequest {
  name: string;
  short_name?: string;
  company_type: number;
  country?: string;
  email: string;
  phone?: string;
  parent_company?: string;
  is_third_party: boolean;
  is_active: boolean;
}

export interface CompanyUpdateRequest {
  name: string;
  short_name?: string;
  company_type: number;
  country?: string;
  email: string;
  phone?: string;
  parent_company?: string;
  is_third_party: boolean;
  is_active: boolean;
}

// Company type options
export const COMPANY_TYPES = [
  { value: 1, label: 'Customer' },
  { value: 2, label: 'Vendor' },
  { value: 3, label: 'Partner' },
  { value: 4, label: 'Supplier' },
  { value: 5, label: 'Subsidiary' },
];

// Country options (common countries)
export const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'EG', label: 'Egypt' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'KE', label: 'Kenya' },
  { value: 'MA', label: 'Morocco' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'LY', label: 'Libya' },
  { value: 'SD', label: 'Sudan' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'GH', label: 'Ghana' },
  { value: 'CI', label: 'Ivory Coast' },
  { value: 'SN', label: 'Senegal' },
  { value: 'ML', label: 'Mali' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'NE', label: 'Niger' },
  { value: 'TD', label: 'Chad' },
  { value: 'CM', label: 'Cameroon' },
  { value: 'CF', label: 'Central African Republic' },
  { value: 'CG', label: 'Congo' },
  { value: 'CD', label: 'Democratic Republic of the Congo' },
  { value: 'AO', label: 'Angola' },
  { value: 'ZM', label: 'Zambia' },
  { value: 'ZW', label: 'Zimbabwe' },
  { value: 'BW', label: 'Botswana' },
  { value: 'NA', label: 'Namibia' },
  { value: 'SZ', label: 'Eswatini' },
  { value: 'LS', label: 'Lesotho' },
  { value: 'MG', label: 'Madagascar' },
  { value: 'MU', label: 'Mauritius' },
  { value: 'SC', label: 'Seychelles' },
  { value: 'KM', label: 'Comoros' },
  { value: 'DJ', label: 'Djibouti' },
  { value: 'SO', label: 'Somalia' },
  { value: 'ER', label: 'Eritrea' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'UG', label: 'Uganda' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'BI', label: 'Burundi' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'MW', label: 'Malawi' },
  { value: 'MZ', label: 'Mozambique' },
  { value: 'MG', label: 'Madagascar' },
  { value: 'MU', label: 'Mauritius' },
  { value: 'SC', label: 'Seychelles' },
  { value: 'KM', label: 'Comoros' },
  { value: 'DJ', label: 'Djibouti' },
  { value: 'SO', label: 'Somalia' },
  { value: 'ER', label: 'Eritrea' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'UG', label: 'Uganda' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'BI', label: 'Burundi' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'MW', label: 'Malawi' },
  { value: 'MZ', label: 'Mozambique' },
];
