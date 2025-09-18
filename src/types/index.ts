/**
 * TypeScript interfaces and types for the Zendesk Automation System
 */

// Zendesk API Types
export interface ZendeskTicket {
  id: number;
  url: string;
  subject: string;
  description?: string;
  status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  type: 'problem' | 'incident' | 'question' | 'task';
  tags: string[];
  created_at: string;
  updated_at: string;
  assignee_id?: number;
  group_id?: number;
  requester_id: number;
  submitter_id: number;
  organization_id?: number;
  comments?: ZendeskComment[];
  fullText?: string;
}

export interface ZendeskComment {
  id: number;
  type: 'Comment' | 'VoiceComment';
  author_id: number;
  body: string;
  html_body: string;
  plain_body: string;
  public: boolean;
  created_at: string;
  attachments: any[];
}

export interface ZendeskSearchResult {
  results: ZendeskTicket[];
  count: number;
  next_page?: string;
  previous_page?: string;
}

export interface ZendeskApiResponse<T> {
  [key: string]: T;
}

// Analysis Types
export interface CategoryAnalysis {
  category: string;
  score: number;
  matchedKeywords: string[];
  confidence: number;
}

export interface PriorityAnalysis {
  level: 'urgent' | 'high' | 'normal' | 'low';
  score: number;
  matchedKeywords: string[];
  confidence: number;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  positiveWords: string[];
  negativeWords: string[];
  confidence: number;
}

export interface ProductAnalysis {
  product: string;
  matchedKeywords: string[];
  confidence: number;
}

export interface TicketAnalysis {
  ticketId: number;
  categories: CategoryAnalysis[];
  priority: PriorityAnalysis;
  sentiment: SentimentAnalysis;
  products: ProductAnalysis[];
  suggestedTags: string[];
  confidence: number;
  error?: string;
}

// Configuration Types
export interface AutomationConfig {
  hoursBack: number;
  batchSize: number;
  delayBetweenBatches: number;
  dryRun: boolean;
  minConfidence: number;
  maxTags: number;
  enablePriorityUpdate: boolean;
  enableReporting: boolean;
  continuous?: boolean;
  intervalMinutes?: number;
}

export interface TaggingOptions {
  dryRun: boolean;
  minConfidence: number;
  maxTags: number;
  preserveExistingTags: boolean;
  batchSize?: number;
  delayBetweenBatches?: number;
}

// Operation Result Types
export interface TaggingResult {
  ticketId: number;
  status: 'success' | 'error' | 'skipped' | 'dry-run';
  tags?: string[];
  confidence?: number;
  error?: string;
  reason?: string;
  response?: any;
}

export interface BatchTaggingResults {
  total: number;
  success: number;
  skipped: number;
  errors: number;
  details: TaggingResult[];
}

export interface PriorityUpdateResult {
  ticketId: number;
  status: 'success' | 'error' | 'skipped' | 'dry-run';
  priority?: string;
  error?: string;
  reason?: string;
  response?: any;
}

// Statistics and Reporting Types
export interface AutomationStats {
  startTime: Date | null;
  endTime: Date | null;
  ticketsProcessed: number;
  ticketsTagged: number;
  ticketsSkipped: number;
  errors: number;
}

export interface AutomationReport {
  summary: {
    startTime: Date | null;
    endTime: Date | null;
    duration: string;
    ticketsProcessed: number;
    ticketsTagged: number;
    ticketsSkipped: number;
    errors: number;
    successRate: number;
  };
  configuration: AutomationConfig;
  taggingResults: BatchTaggingResults | null;
  autoTaggerReport: AutoTaggerReport | null;
  errorStats: ErrorStats;
}

export interface AutoTaggerReport {
  totalTickets: number;
  averageConfidence?: number;
  tagFrequency?: Record<string, number>;
  categoryDistribution?: Record<string, number>;
  timeRange?: {
    start: number;
    end: number;
  };
  message?: string;
}

export interface TicketStats {
  new: number;
  open: number;
  pending: number;
  total: number;
  error?: string;
}

// Error Handling Types
export interface ErrorStats {
  totalErrors: number;
  errorTypes: Record<string, {
    count: number;
    operations: Record<string, number>;
  }>;
  mostFrequentErrors: Array<{
    type: string;
    count: number;
  }>;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  operation: string;
}

// Keyword Configuration Types
export interface KeywordConfig {
  keywords: string[];
  weight: number;
}

export interface CategoryKeywords {
  [category: string]: KeywordConfig;
}

export interface PriorityKeywords {
  [priority: string]: KeywordConfig;
}

export interface SentimentKeywords {
  positive: string[];
  negative: string[];
}

export interface ProductKeywords {
  [product: string]: string[];
}

// Fetcher Criteria Types
export interface TicketFetchCriteria {
  status?: string;
  priority?: string;
  tags?: string[];
  assigneeId?: number;
  groupId?: number;
  createdAfter?: Date | string;
}

// Logger Types
export interface LogContext {
  [key: string]: any;
}

export interface LoggerChild {
  info: (message: string, meta?: LogContext) => void;
  error: (message: string, error?: Error | LogContext) => void;
  warn: (message: string, meta?: LogContext) => void;
  debug: (message: string, meta?: LogContext) => void;
  logAutomationEvent: (event: string, data?: LogContext) => void;
  logTicketAction: (action: string, ticketId: number, data?: LogContext) => void;
  logApiRequest: (method: string, endpoint: string, statusCode: number, duration: number, meta?: LogContext) => void;
  logAnalysis: (analysis: TicketAnalysis) => void;
  logTagging: (taggingResult: TaggingResult) => void;
  logBatchSummary: (operation: string, summary: any) => void;
}

// Applied Tags Tracking
export interface AppliedTagInfo {
  tags: string[];
  confidence: number;
  timestamp: Date;
  analysis: TicketAnalysis;
}

// API Error Types
export interface ZendeskApiError {
  error: string;
  description?: string;
  details?: any;
}

// Environment Variables
export interface EnvironmentConfig {
  ZENDESK_EMAIL: string;
  ZENDESK_TOKEN: string;
  ZENDESK_SUBDOMAIN: string;
  LOG_LEVEL?: string;
  NODE_ENV?: string;
}