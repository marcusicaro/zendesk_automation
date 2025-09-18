#!/usr/bin/env node

import dotenv from 'dotenv';
import moment from 'moment';
import ZendeskClient from './services/zendeskClient.js';
import TicketFetcher from './services/ticketFetcher.js';
import ContentAnalyzer from './services/contentAnalyzer.js';
import AutoTagger from './services/autoTagger.js';
import logger from './utils/logger.js';
import errorHandler from './utils/errorHandler.js';
import type { 
  AutomationConfig, 
  TicketFetchCriteria, 
  ZendeskTicket, 
  TicketAnalysis,
  BatchTaggingResults,
  AutomationReport
} from './types/index.js';

// Load environment variables
dotenv.config();

/**
 * Zendesk Ticket Automation System
 * Main orchestration class for the ticket automation pipeline
 */
class TicketAutomationSystem {
  private client: ZendeskClient;
  private fetcher: TicketFetcher;
  private analyzer: ContentAnalyzer;
  private tagger: AutoTagger;
  private config: AutomationConfig;
  private logger = logger.child({ component: 'automation' });

  constructor(config?: Partial<AutomationConfig>) {
    // Default configuration
    this.config = {
      hoursBack: 24,
      batchSize: 10,
      delayBetweenBatches: 100,
      dryRun: true,
      minConfidence: 0.7,
      maxTags: 10,
      enablePriorityUpdate: false,
      enableReporting: true,
      continuous: false,
      intervalMinutes: 60,
      ...config
    };

    // Initialize services
    this.client = new ZendeskClient();
    this.fetcher = new TicketFetcher(this.client);
    this.analyzer = new ContentAnalyzer();
    this.tagger = new AutoTagger(this.client, this.config);

    this.logger.info('🚀 Ticket Automation System initialized', { config: this.config });
  }

  /**
   * Run the complete automation pipeline
   */
  async run(criteria?: TicketFetchCriteria): Promise<AutomationReport> {
    const startTime = new Date();
    this.logger.logAutomationEvent('automation_started', { criteria });

    let ticketsProcessed = 0;
    let ticketsTagged = 0;
    let ticketsSkipped = 0;
    let errors = 0;
    let taggingResults: BatchTaggingResults | null = null;

    try {
      // Step 1: Fetch tickets
      this.logger.info('📥 Step 1: Fetching tickets...');
      const tickets = await this.fetchTickets(criteria);
      
      if (tickets.length === 0) {
        this.logger.info('ℹ️  No tickets found matching criteria');
        return this.generateReport(startTime, 0, 0, 0, 0, null);
      }

      ticketsProcessed = tickets.length;
      this.logger.info(`✅ Found ${tickets.length} tickets to process`);

      // Step 2: Analyze tickets
      this.logger.info('🔍 Step 2: Analyzing ticket content...');
      const analysisResults = await this.analyzeTickets(tickets);
      this.logger.info(`✅ Analysis complete for ${analysisResults.length} tickets`);

      // Step 3: Apply tags
      this.logger.info('🏷️  Step 3: Applying tags...');
      taggingResults = await this.applyTags(analysisResults, tickets);
      
      ticketsTagged = taggingResults.success;
      ticketsSkipped = taggingResults.skipped;
      errors = taggingResults.errors;

      this.logger.info('✅ Automation pipeline complete');
      
    } catch (error) {
      errors++;
      this.logger.error('❌ Automation pipeline failed', error as Error);
      throw error;
    }

    const report = this.generateReport(
      startTime, 
      ticketsProcessed, 
      ticketsTagged, 
      ticketsSkipped, 
      errors, 
      taggingResults
    );

    this.logger.logBatchSummary('automation_complete', report.summary);
    return report;
  }

  /**
   * Fetch tickets based on criteria
   */
  private async fetchTickets(criteria?: TicketFetchCriteria): Promise<ZendeskTicket[]> {
    const tickets = await errorHandler.handleWithRetry(
      () => this.fetcher.fetchNewTickets(this.config.hoursBack, ['auto-processed']),
      { maxRetries: 3, baseDelay: 1000, operation: 'fetch_tickets' }
    );

    // Get detailed ticket information (limit to reasonable batch size)
    const limitedTickets = tickets.slice(0, 50); // Reasonable limit
    const detailedTickets = await this.fetcher.batchFetchDetailedTickets(
      limitedTickets, 
      this.config.batchSize
    );

    return detailedTickets;
  }

  /**
   * Analyze tickets using content analyzer
   */
  private async analyzeTickets(tickets: ZendeskTicket[]): Promise<TicketAnalysis[]> {
    const results = this.analyzer.batchAnalyze(tickets);
    
    // Log analysis results
    results.forEach(analysis => {
      this.logger.logAnalysis(analysis);
    });

    return results;
  }

  /**
   * Apply tags to tickets based on analysis
   */
  private async applyTags(
    analysisResults: TicketAnalysis[], 
    tickets: ZendeskTicket[]
  ): Promise<BatchTaggingResults> {
    const results = await this.tagger.batchApplyTags(analysisResults, tickets);
    
    // Log tagging results
    results.details.forEach(result => {
      this.logger.logTagging(result);
    });

    // Generate and log report
    const report = this.tagger.generateReport(results);
    console.log(report);

    return results;
  }

  /**
   * Generate automation report
   */
  private generateReport(
    startTime: Date,
    ticketsProcessed: number,
    ticketsTagged: number,
    ticketsSkipped: number,
    errors: number,
    taggingResults: BatchTaggingResults | null
  ): AutomationReport {
    const endTime = new Date();
    const duration = moment.duration(endTime.getTime() - startTime.getTime());

    return {
      summary: {
        startTime,
        endTime,
        duration: duration.humanize(),
        ticketsProcessed,
        ticketsTagged,
        ticketsSkipped,
        errors,
        successRate: ticketsProcessed > 0 ? (ticketsTagged / ticketsProcessed) * 100 : 0
      },
      configuration: this.config,
      taggingResults,
      autoTaggerReport: null, // Could be expanded
      errorStats: errorHandler.getErrorStats()
    };
  }

  /**
   * Update automation configuration
   */
  updateConfig(newConfig: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.tagger.updateConfig(this.config);
    this.logger.info('🔧 Configuration updated', { newConfig });
  }

  /**
   * Get current configuration
   */
  getConfig(): AutomationConfig {
    return { ...this.config };
  }

  /**
   * Test the automation system
   */
  async test(): Promise<boolean> {
    try {
      this.logger.info('🧪 Testing automation system...');

      // Test with a small batch
      const originalConfig = { ...this.config };
      this.updateConfig({ 
        dryRun: true,
        minConfidence: 0.5,
        hoursBack: 168 // 1 week to get more test data
      });

      const report = await this.run();
      
      // Restore original config
      this.updateConfig(originalConfig);

      this.logger.info('✅ Automation system test completed', {
        ticketsProcessed: report.summary.ticketsProcessed,
        successRate: report.summary.successRate
      });

      return true;
    } catch (error) {
      this.logger.error('❌ Automation system test failed', error as Error);
      return false;
    }
  }
}

/**
 * CLI Interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
Zendesk Ticket Automation System

Usage:
  npm start                    # Run automation with default settings
  npm start -- --dry-run       # Run in dry-run mode (no changes)
  npm start -- --test          # Test the system
  npm start -- --confidence 0.8 # Set minimum confidence threshold

Options:
  --help, -h          Show this help message
  --test              Run system test
  --dry-run           Run without making changes
  --confidence <num>  Set minimum confidence threshold (0-1)
  --hours-back <num>  Hours back to search for tickets (default: 24)
  --status <status>   Filter tickets by status (new, open, pending, etc.)

Examples:
  npm start -- --dry-run --confidence 0.8 --hours-back 48
  npm start -- --test
      `);
      return;
    }

    // Parse command line arguments
    const config: Partial<AutomationConfig> = {
      dryRun: args.includes('--dry-run')
    };

    // Parse confidence if provided
    if (args.includes('--confidence')) {
      const confIndex = args.indexOf('--confidence');
      const confValue = args[confIndex + 1];
      if (confValue) {
        config.minConfidence = parseFloat(confValue) || 0.7;
      }
    }

    // Parse hours back if provided 
    if (args.includes('--hours-back')) {
      const hoursIndex = args.indexOf('--hours-back');
      const hoursValue = args[hoursIndex + 1];
      if (hoursValue) {
        config.hoursBack = parseInt(hoursValue) || 24;
      }
    }

    const automation = new TicketAutomationSystem(config);

    if (args.includes('--test')) {
      console.log('🧪 Running system test...');
      const success = await automation.test();
      process.exit(success ? 0 : 1);
    } else {
      console.log('🚀 Starting Zendesk Ticket Automation...');
      
      const criteria: TicketFetchCriteria = {};
      if (args.includes('--status')) {
        criteria.status = args[args.indexOf('--status') + 1];
      }

      const report = await automation.run(criteria);
      
      console.log('\n📊 AUTOMATION SUMMARY');
      console.log('═'.repeat(50));
      console.log(`⏱️  Duration: ${report.summary.duration}`);
      console.log(`📥 Tickets Processed: ${report.summary.ticketsProcessed}`);
      console.log(`🏷️  Tickets Tagged: ${report.summary.ticketsTagged}`);
      console.log(`⏭️  Tickets Skipped: ${report.summary.ticketsSkipped}`);
      console.log(`❌ Errors: ${report.summary.errors}`);
      console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
      console.log(`🔧 Dry Run: ${report.configuration.dryRun ? 'Yes' : 'No'}`);
      
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Fatal error:', (error as Error).message);
    logger.error('Fatal error in main', error as Error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled promise rejection', reason as Error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TicketAutomationSystem;
export { TicketAutomationSystem };