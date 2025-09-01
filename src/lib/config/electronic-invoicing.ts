import { 
  ARUBA_FE_ENVIRONMENT,
  FEATURE_ELECTRONIC_INVOICING,
  ARUBA_FE_TEST_BASE_URL,
  ARUBA_FE_TEST_USERNAME,
  ARUBA_FE_TEST_PASSWORD,
  ARUBA_FE_PROD_BASE_URL,
  ARUBA_FE_PROD_USERNAME,
  ARUBA_FE_PROD_PASSWORD
} from '$env/static/private';

export interface ElectronicInvoicingConfig {
  enabled: boolean;
  environment: 'test' | 'production' | 'mock';
  authUrl: string;
  baseUrl: string;
  username: string;
  password: string;
}

function getElectronicInvoicingConfig(): ElectronicInvoicingConfig {
  const environment = (ARUBA_FE_ENVIRONMENT || 'mock') as 'test' | 'production' | 'mock';
  const enabled = FEATURE_ELECTRONIC_INVOICING === 'true';
  
  // Mock mode for testing without Aruba
  if (environment === 'mock') {
    return {
      enabled,
      environment,
      authUrl: 'https://mock.aruba.local/auth',
      baseUrl: 'https://mock.aruba.local/api',
      username: 'mock_user',
      password: 'mock_password'
    };
  }
  
  const isTest = environment === 'test';
  const authUrl = isTest 
    ? 'https://demoauth.fatturazioneelettronica.aruba.it'
    : 'https://auth.fatturazioneelettronica.aruba.it';
    
  const baseUrl = isTest 
    ? (ARUBA_FE_TEST_BASE_URL || 'https://demows.fatturazioneelettronica.aruba.it')
    : (ARUBA_FE_PROD_BASE_URL || 'https://ws.fatturazioneelettronica.aruba.it');
  
  const username = isTest 
    ? ARUBA_FE_TEST_USERNAME || ''
    : ARUBA_FE_PROD_USERNAME || '';
  
  const password = isTest 
    ? ARUBA_FE_TEST_PASSWORD || ''
    : ARUBA_FE_PROD_PASSWORD || '';

  return {
    enabled,
    environment,
    authUrl,
    baseUrl,
    username,
    password
  };
}

export const electronicInvoicingConfig = getElectronicInvoicingConfig();

// Aruba specific configuration
export const ARUBA_CONFIG = {
  // Aruba's fiscal code as transmitter
  TRASMITTENTE_CODICE_FISCALE: '01879020517',
  
  // Rate limits (per minute)
  RATE_LIMITS: {
    UPLOAD: 30,
    SEARCH: 12
  },
  
  // Max file size (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  // Token expiry (30 minutes)
  TOKEN_EXPIRY_MINUTES: 30,
  
  // Invoice status codes
  STATUS_CODES: {
    PENDING: 'pending',
    SENT: 'sent',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    DELIVERED: 'delivered'
  } as const
} as const;