import axios, { AxiosInstance, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import type {
  ZendeskTicket,
  ZendeskComment,
  ZendeskSearchResult,
  ZendeskApiResponse,
  EnvironmentConfig
} from '../types/index.js';

dotenv.config();

/**
 * Zendesk API Client
 * Handles authentication and API requests to Zendesk REST API
 */
class ZendeskClient {
  private email: string;
  private token: string;
  private subdomain: string;
  private baseURL: string;
  private authHeader: string;
  public client: AxiosInstance;

  constructor() {
    const env = process.env as Partial<EnvironmentConfig>;
    
    this.email = env.ZENDESK_EMAIL || '';
    this.token = env.ZENDESK_TOKEN || '';
    this.subdomain = env.ZENDESK_SUBDOMAIN || '';
    
    if (!this.email || !this.token || !this.subdomain) {
      throw new Error('Missing required Zendesk credentials in .env file');
    }

    this.baseURL = `https://${this.subdomain}.zendesk.com/api/v2`;
    this.authHeader = this.createAuthHeader();
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  /**
   * Create Basic Auth header for Zendesk API
   */
  private createAuthHeader(): string {
    const credentials = `${this.email}/token:${this.token}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return `Basic ${encodedCredentials}`;
  }

  /**
   * Setup axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Making API request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`API error: ${error.response?.status} - ${error.config?.url}`);
        if (error.response?.data) {
          console.error('Error details:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch tickets with optional query parameters
   */
  async getTickets(params: Record<string, any> = {}): Promise<ZendeskApiResponse<ZendeskTicket[]>> {
    try {
      const response: AxiosResponse<ZendeskApiResponse<ZendeskTicket[]>> = await this.client.get('/tickets.json', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tickets: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch recent tickets (created in the last 24 hours by default)
   */
  async getRecentTickets(hoursBack: number = 24): Promise<ZendeskSearchResult> {
    const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    const timestamp = startTime.toISOString();
    
    const params = {
      query: `created>${timestamp}`,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    try {
      const response: AxiosResponse<ZendeskSearchResult> = await this.client.get('/search.json', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch recent tickets: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch tickets by status
   */
  async getTicketsByStatus(status: string): Promise<ZendeskSearchResult> {
    const params = {
      query: `status:${status}`,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    try {
      const response: AxiosResponse<ZendeskSearchResult> = await this.client.get('/search.json', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tickets by status: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific ticket by ID
   */
  async getTicket(ticketId: number): Promise<ZendeskApiResponse<ZendeskTicket>> {
    try {
      const response: AxiosResponse<ZendeskApiResponse<ZendeskTicket>> = await this.client.get(`/tickets/${ticketId}.json`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch ticket ${ticketId}: ${(error as Error).message}`);
    }
  }

  /**
   * Update a ticket with new data
   */
  async updateTicket(ticketId: number, ticketData: Partial<ZendeskTicket>): Promise<ZendeskApiResponse<ZendeskTicket>> {
    try {
      const response: AxiosResponse<ZendeskApiResponse<ZendeskTicket>> = await this.client.put(`/tickets/${ticketId}.json`, {
        ticket: ticketData
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update ticket ${ticketId}: ${(error as Error).message}`);
    }
  }

  /**
   * Add tags to a ticket
   */
  async addTagsToTicket(ticketId: number, tags: string[]): Promise<ZendeskApiResponse<ZendeskTicket>> {
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error('Tags must be a non-empty array');
    }

    try {
      const response: AxiosResponse<ZendeskApiResponse<ZendeskTicket>> = await this.client.put(`/tickets/${ticketId}.json`, {
        ticket: {
          additional_tags: tags
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add tags to ticket ${ticketId}: ${(error as Error).message}`);
    }
  }

  /**
   * Get ticket comments/conversations
   */
  async getTicketComments(ticketId: number): Promise<ZendeskApiResponse<ZendeskComment[]>> {
    try {
      const response: AxiosResponse<ZendeskApiResponse<ZendeskComment[]>> = await this.client.get(`/tickets/${ticketId}/comments.json`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch comments for ticket ${ticketId}: ${(error as Error).message}`);
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/tickets.json?per_page=1');
      console.log('✅ Zendesk API connection successful');
      return true;
    } catch (error) {
      console.error('❌ Zendesk API connection failed:', (error as Error).message);
      return false;
    }
  }
}

export default ZendeskClient;