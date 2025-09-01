import { electronicInvoicingConfig, ARUBA_CONFIG } from '$lib/config/electronic-invoicing';
import type { ElectronicInvoiceStatus, SDIError } from './types';

export interface ArubaAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface ArubaUploadResponse {
  success: boolean;
  uploadFilename?: string;
  errors?: Array<{
    code: string;
    description: string;
  }>;
}

export interface ArubaInvoiceStatus {
  filename: string;
  sdiId?: string;
  status: ElectronicInvoiceStatus;
  submissionDate?: string;
  lastUpdate?: string;
  errors?: SDIError[];
  notifications?: Array<{
    type: string;
    date: string;
    description: string;
  }>;
}

export class ArubaAPIClient {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshToken: string | null = null;
  private readonly authUrl: string;
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly isMockMode: boolean;

  constructor() {
    if (!electronicInvoicingConfig.enabled) {
      throw new Error('Electronic invoicing is not enabled');
    }
    
    this.authUrl = electronicInvoicingConfig.authUrl;
    this.baseUrl = electronicInvoicingConfig.baseUrl;
    this.username = electronicInvoicingConfig.username;
    this.password = electronicInvoicingConfig.password;
    this.isMockMode = electronicInvoicingConfig.environment === 'mock';

    if (!this.isMockMode && (!this.username || !this.password)) {
      throw new Error('Aruba API credentials are not configured');
    }
  }

  /**
   * Authenticate with Aruba API
   */
  async authenticate(): Promise<void> {
    // Mock mode for testing
    if (this.isMockMode) {
      this.accessToken = 'mock_access_token_' + Date.now();
      this.refreshToken = 'mock_refresh_token';
      this.tokenExpiry = new Date();
      this.tokenExpiry.setMinutes(this.tokenExpiry.getMinutes() + 30);
      return;
    }

    try {
      const authEndpoint = `${this.authUrl}/auth/signin`;
      
      const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const authData: ArubaAuthResponse = await response.json();
      
      this.accessToken = authData.access_token;
      this.refreshToken = authData.refresh_token || null;
      
      // Calculate token expiry (30 minutes from now)
      this.tokenExpiry = new Date();
      this.tokenExpiry.setMinutes(
        this.tokenExpiry.getMinutes() + (authData.expires_in / 60)
      );
      
    } catch (error) {
      console.error('Aruba authentication error:', error);
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Get authenticated headers for API calls
   */
  private getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Upload invoice XML to Aruba for transmission to SDI
   */
  async uploadInvoice(xmlContent: string, filename?: string): Promise<ArubaUploadResponse> {
    await this.ensureAuthenticated();
    
    const uploadFilename = filename || `invoice_${Date.now()}.xml`;

    // Mock mode for testing
    if (this.isMockMode) {
      console.log(`[MOCK] Uploading invoice: ${uploadFilename}`);
      console.log(`[MOCK] XML size: ${new Blob([xmlContent]).size} bytes`);
      
      return {
        success: true,
        uploadFilename,
        errors: []
      };
    }

    try {
      // Validate file size
      const xmlSize = new Blob([xmlContent]).size;
      if (xmlSize > ARUBA_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`XML file size (${xmlSize} bytes) exceeds maximum allowed (${ARUBA_CONFIG.MAX_FILE_SIZE} bytes)`);
      }

      const uploadUrl = `${this.baseUrl}/services/invoice/upload`;

      const formData = new FormData();
      formData.append('file', new Blob([xmlContent], { type: 'application/xml' }), uploadFilename);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        success: result.success || false,
        uploadFilename: result.uploadFilename || uploadFilename,
        errors: result.errors || []
      };

    } catch (error) {
      console.error('Invoice upload error:', error);
      return {
        success: false,
        errors: [{ code: 'UPLOAD_ERROR', description: `Upload failed: ${error}` }]
      };
    }
  }

  /**
   * Get invoice status from Aruba/SDI
   */
  async getInvoiceStatus(filename: string): Promise<ArubaInvoiceStatus | null> {
    await this.ensureAuthenticated();

    // Mock mode for testing
    if (this.isMockMode) {
      console.log(`[MOCK] Checking status for invoice: ${filename}`);
      
      // Simulate different statuses based on filename patterns for testing
      const mockStatuses: ElectronicInvoiceStatus[] = ['sent', 'accepted', 'delivered'];
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
      
      return {
        filename,
        sdiId: `SDI${Date.now()}`,
        status: randomStatus,
        submissionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        lastUpdate: new Date().toISOString(),
        errors: [],
        notifications: [
          {
            type: 'INFO',
            date: new Date().toISOString(),
            description: `Mock notification for ${filename}`
          }
        ]
      };
    }

    try {
      const statusUrl = `${this.baseUrl}/services/invoice/find/${encodeURIComponent(filename)}`;

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.status === 404) {
        return null; // Invoice not found
      }

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }

      const statusData = await response.json();
      
      return {
        filename: statusData.filename,
        sdiId: statusData.sdiId,
        status: this.mapArubaStatusToLocal(statusData.status),
        submissionDate: statusData.submissionDate,
        lastUpdate: statusData.lastUpdate,
        errors: statusData.errors?.map((err: any) => ({
          code: err.code,
          description: err.description,
          severity: err.severity || 'error'
        })) || [],
        notifications: statusData.notifications || []
      };

    } catch (error) {
      console.error('Status check error:', error);
      throw error;
    }
  }

  /**
   * Get all invoices for the current account
   */
  async getInvoicesList(limit = 50, offset = 0): Promise<ArubaInvoiceStatus[]> {
    await this.ensureAuthenticated();

    try {
      const listUrl = `${this.baseUrl}/services/invoice/list?limit=${limit}&offset=${offset}`;

      const response = await fetch(listUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`List invoices failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.invoices || []).map((invoice: any) => ({
        filename: invoice.filename,
        sdiId: invoice.sdiId,
        status: this.mapArubaStatusToLocal(invoice.status),
        submissionDate: invoice.submissionDate,
        lastUpdate: invoice.lastUpdate,
        errors: invoice.errors || [],
        notifications: invoice.notifications || []
      }));

    } catch (error) {
      console.error('List invoices error:', error);
      throw error;
    }
  }

  /**
   * Download notifications for a specific invoice
   */
  async getInvoiceNotifications(filename: string): Promise<any[]> {
    await this.ensureAuthenticated();

    try {
      const notificationsUrl = `${this.baseUrl}/services/invoice/notifications/${encodeURIComponent(filename)}`;

      const response = await fetch(notificationsUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Get notifications failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.notifications || [];

    } catch (error) {
      console.error('Get notifications error:', error);
      return [];
    }
  }

  /**
   * Test connection to Aruba API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    // Mock mode for testing
    if (this.isMockMode) {
      return {
        success: true,
        message: 'Successfully connected to mock Aruba environment for testing'
      };
    }

    try {
      await this.authenticate();
      
      // Try to get a simple list to verify the connection works
      const testUrl = `${this.baseUrl}/services/invoice/list?limit=1`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully connected to Aruba ${electronicInvoicingConfig.environment} environment`
        };
      } else {
        return {
          success: false,
          message: `Connection test failed: ${response.status} ${response.statusText}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error}`
      };
    }
  }

  /**
   * Map Aruba status codes to our local status enum
   */
  private mapArubaStatusToLocal(arubaStatus: string): ElectronicInvoiceStatus {
    const statusMap: Record<string, ElectronicInvoiceStatus> = {
      'PENDING': 'pending',
      'SENT': 'sent',
      'ACCEPTED': 'accepted',
      'REJECTED': 'rejected',
      'DELIVERED': 'delivered'
    };

    return statusMap[arubaStatus?.toUpperCase()] || 'pending';
  }

  /**
   * Check if we're using test environment
   */
  get isTestEnvironment(): boolean {
    return electronicInvoicingConfig.environment === 'test';
  }

  /**
   * Get current environment info
   */
  getEnvironmentInfo(): { environment: string; baseUrl: string; isTest: boolean } {
    return {
      environment: electronicInvoicingConfig.environment,
      baseUrl: this.baseUrl,
      isTest: this.isTestEnvironment
    };
  }

  /**
   * Sign out and clear tokens
   */
  async signOut(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshToken = null;
  }
}