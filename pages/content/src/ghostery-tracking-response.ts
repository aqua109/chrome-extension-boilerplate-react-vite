export type Root = TrackingResponse[];

export interface TrackingResponse {
  pattern: Pattern;
  category: Category;
  organization: Organization;
}

export interface Pattern {
  key: string;
  name: string;
  category: string;
  organization: string;
  alias: string;
  website_url: string;
  ghostery_id: string;
  domains: string[];
  filters: string[];
}

export interface Category {
  key: string;
  name: string;
  color: string;
  description: string;
}

export interface Organization {
  key: string;
  name: string;
  description: string;
  website_url: string;
  country: string;
  privacy_policy_url: string;
  privacy_contact: string;
  ghostery_id: string;
}
