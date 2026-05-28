export * from './truth-source-schemas';

export interface WebsiteConfig {
  // NAP
  businessName: string;
  phone:        string;
  address:      string;
  city:         string;
  state:        string;
  zip:          string;
  domain:       string;
  // Brand
  primaryColor:   string;
  secondaryColor: string;
  // CTA routing — injected by the Scaffold Engine
  primaryCtaType:  'call' | 'form' | 'dual';
  primaryCtaValue: string;
  formEndpoint:    string;
  // Analytics
  gtmId: string;
}

export interface ClientMeta {
  slug: string;
  displayName: string;
  status: "active" | "onboarding" | "paused";
}
