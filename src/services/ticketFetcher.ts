import moment from 'moment';
import type {
  ZendeskTicket,
  ZendeskComment,
  ZendeskSearchResult,
  TicketFetchCriteria,
  TicketStats
} from '../types/index.js';
import type ZendeskClient from './zendeskClient.js';

/**
 * Ticket Fetcher Service
 * Handles fetching and filtering tickets from Zendesk
 */
class TicketFetcher {
  private client: ZendeskClient;

  constructor(zendeskClient: ZendeskClient) {
    this.client = zendeskClient;
  }

  /**
   * Fetch new tickets that haven't been processed yet
   */
  async fetchNewTickets(hoursBack: number = 24, excludeTags: string[] = ['auto-processed']): Promise<ZendeskTicket[]> {
    try {
      console.log(`🔍 Fetching tickets from the last ${hoursBack} hours...`);
      
      // Get recent tickets
      const response = await this.client.getRecentTickets(hoursBack);
      
      if (!response.results || response.results.length === 0) {
        console.log('No recent tickets found');
        return [];
      }

      console.log(`Found ${response.results.length} recent tickets`);

      // Filter out tickets that have already been processed
      const unprocessedTickets = response.results.filter(ticket => {
        // Skip if ticket already has auto-processing tags
        const hasExcludedTags = excludeTags.some(tag => 
          ticket.tags && ticket.tags.includes(tag)
        );
        
        // Only process tickets that don't have excluded tags
        return !hasExcludedTags;
      });

      console.log(`${unprocessedTickets.length} tickets need processing`);
      
      return unprocessedTickets;
    } catch (error) {
      console.error('Error fetching new tickets:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Fetch tickets by specific criteria
   */
  async fetchTicketsByCriteria(criteria: TicketFetchCriteria = {}): Promise<ZendeskTicket[]> {
    const {
      status = 'new',
      priority = null,
      tags = null,
      assigneeId = null,
      groupId = null,
      createdAfter = null
    } = criteria;

    try {
      let queryParts: string[] = [`status:${status}`];

      if (priority) {
        queryParts.push(`priority:${priority}`);
      }

      if (tags && tags.length > 0) {
        queryParts.push(`tags:${tags.join(' tags:')}`);
      }

      if (assigneeId) {
        queryParts.push(`assignee:${assigneeId}`);
      }

      if (groupId) {
        queryParts.push(`group:${groupId}`);
      }

      if (createdAfter) {
        const timestamp = moment(createdAfter).toISOString();
        queryParts.push(`created>${timestamp}`);
      }

      const query = queryParts.join(' ');
      console.log(`🔍 Searching tickets with query: ${query}`);

      const params = {
        query,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response: ZendeskSearchResult = await this.client.client.get('/search.json', { params }).then(res => res.data);
      
      return response.results || [];
    } catch (error) {
      console.error('Error fetching tickets by criteria:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get detailed ticket information including comments
   */
  async getDetailedTicket(ticketId: number): Promise<ZendeskTicket> {
    try {
      // Fetch ticket and comments in parallel
      const [ticketResponse, commentsResponse] = await Promise.all([
        this.client.getTicket(ticketId),
        this.client.getTicketComments(ticketId)
      ]);

      const ticket = ticketResponse.ticket;
      const comments = commentsResponse.comments;

      if (!ticket) {
        throw new Error(`Ticket ${ticketId} not found`);
      }

      // Combine ticket data with comments
      return {
        ...ticket,
        comments: comments,
        fullText: this.extractFullText(ticket, comments || [])
      };
    } catch (error) {
      console.error(`Error fetching detailed ticket ${ticketId}:`, (error as Error).message);
      throw error;
    }
  }

  /**
   * Extract all text content from ticket and comments for analysis
   */
  private extractFullText(ticket: ZendeskTicket, comments: ZendeskComment[]): string {
    let fullText = '';

    // Add ticket subject and description
    if (ticket.subject) {
      fullText += `Subject: ${ticket.subject}\n\n`;
    }

    if (ticket.description) {
      fullText += `Description: ${ticket.description}\n\n`;
    }

    // Add all comments
    if (comments && comments.length > 0) {
      comments.forEach((comment, index) => {
        if (comment.body && comment.public) {
          fullText += `Comment ${index + 1}: ${comment.body}\n\n`;
        }
      });
    }

    return fullText.trim();
  }

  /**
   * Batch fetch detailed information for multiple tickets
   */
  async batchFetchDetailedTickets(tickets: ZendeskTicket[], batchSize: number = 5): Promise<ZendeskTicket[]> {
    const detailedTickets: ZendeskTicket[] = [];
    
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = tickets.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(tickets.length / batchSize)} (${batch.length} tickets)`);

      try {
        const batchPromises = batch.map(ticket => 
          this.getDetailedTicket(ticket.id)
        );

        const batchResults = await Promise.all(batchPromises);
        detailedTickets.push(...batchResults);

        // Add small delay between batches to respect rate limits
        if (i + batchSize < tickets.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, (error as Error).message);
        // Continue with next batch even if current batch fails
      }
    }

    return detailedTickets;
  }

  /**
   * Get ticket statistics for monitoring
   */
  async getTicketStats(): Promise<TicketStats> {
    try {
      const [newTickets, openTickets, pendingTickets] = await Promise.all([
        this.client.getTicketsByStatus('new'),
        this.client.getTicketsByStatus('open'),
        this.client.getTicketsByStatus('pending')
      ]);

      return {
        new: newTickets.count || 0,
        open: openTickets.count || 0,
        pending: pendingTickets.count || 0,
        total: (newTickets.count || 0) + (openTickets.count || 0) + (pendingTickets.count || 0)
      };
    } catch (error) {
      console.error('Error fetching ticket statistics:', (error as Error).message);
      return {
        new: 0,
        open: 0,
        pending: 0,
        total: 0,
        error: (error as Error).message
      };
    }
  }
}

export default TicketFetcher;