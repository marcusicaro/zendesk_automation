import ZendeskClient from './zendeskClient.js';
import type {
  ZendeskTicket,
  TicketAnalysis,
  BatchTaggingResults,
  TaggingOptions,
  TaggingResult,
  AutomationConfig
} from '../types/index.js';

/**
 * Auto Tagger
 * Applies tags to tickets based on analysis results
 */
class AutoTagger {
  private client: ZendeskClient;
  private config: AutomationConfig;

  constructor(client: ZendeskClient, config: AutomationConfig) {
    this.client = client;
    this.config = config;
  }

  /**
   * Apply tags to a single ticket based on analysis
   */
  async applyTags(ticket: ZendeskTicket, analysis: TicketAnalysis): Promise<TaggingResult> {
    try {
      // Check if we should apply tags based on confidence threshold
      if (analysis.confidence < this.config.minConfidence) {
        return {
          ticketId: ticket.id,
          status: 'skipped',
          confidence: analysis.confidence,
          reason: `Confidence ${analysis.confidence.toFixed(2)} below threshold ${this.config.minConfidence}`
        };
      }

      // Filter out tags we shouldn't apply
      const tagsToApply = this.filterTags(analysis.suggestedTags, ticket.tags || []);
      
      if (tagsToApply.length === 0) {
        return {
          ticketId: ticket.id,
          status: 'skipped',
          confidence: analysis.confidence,
          reason: 'No new tags to apply',
          tags: analysis.suggestedTags
        };
      }

      // Prepare the new tags list
      const newTags = [...new Set([...(ticket.tags || []), ...tagsToApply])];

      // Apply tags via API
      if (this.config.dryRun) {
        console.log(`[DRY RUN] Would apply tags to ticket ${ticket.id}:`, tagsToApply);
        return {
          ticketId: ticket.id,
          status: 'dry-run',
          confidence: analysis.confidence,
          tags: tagsToApply,
          reason: `[DRY RUN] Would apply ${tagsToApply.length} tags`
        };
      }

      const updatedTicket = await this.client.updateTicket(ticket.id, {
        tags: newTags
      });

      return {
        ticketId: ticket.id,
        status: 'success',
        confidence: analysis.confidence,
        tags: tagsToApply,
        response: updatedTicket
      };

    } catch (error) {
      console.error(`Error applying tags to ticket ${ticket.id}:`, (error as Error).message);
      return {
        ticketId: ticket.id,
        status: 'error',
        confidence: analysis.confidence,
        error: (error as Error).message,
        reason: `Failed to apply tags: ${(error as Error).message}`
      };
    }
  }

  /**
   * Filter out tags that shouldn't be applied
   */
  private filterTags(suggestedTags: string[], currentTags: string[]): string[] {
    return suggestedTags.filter(tag => {
      // Skip if tag already exists
      if (currentTags.includes(tag)) {
        return false;
      }

      // Basic validation - remove empty or invalid tags
      if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Batch apply tags to multiple tickets
   */
  async batchApplyTags(
    analysisResults: TicketAnalysis[],
    tickets: ZendeskTicket[]
  ): Promise<BatchTaggingResults> {
    console.log(`🏷️  Starting batch tagging for ${analysisResults.length} tickets...`);
    
    const results: TaggingResult[] = [];
    const startTime = Date.now();
    
    // Create a map for quick ticket lookup
    const ticketMap = new Map<number, ZendeskTicket>();
    tickets.forEach(ticket => ticketMap.set(ticket.id, ticket));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < analysisResults.length; i++) {
      const analysis = analysisResults[i];
      
      if (!analysis) {
        console.warn(`Missing analysis result at index ${i}`);
        continue;
      }

      const ticket = ticketMap.get(analysis.ticketId);
      if (!ticket) {
        console.warn(`Ticket ${analysis.ticketId} not found in provided tickets`);
        errorCount++;
        continue;
      }

      try {
        console.log(`Processing ticket ${analysis.ticketId} (${i + 1}/${analysisResults.length})`);
        
        const result = await this.applyTags(ticket, analysis);
        results.push(result);

        if (result.status === 'success') {
          successCount++;
        } else if (result.status === 'skipped' || result.status === 'dry-run') {
          skipCount++;
        } else {
          errorCount++;
        }

        // Rate limiting - basic delay between requests
        if (i < analysisResults.length - 1) {
          await this.delay(100); // Basic rate limiting
        }

      } catch (error) {
        console.error(`Error processing ticket ${analysis.ticketId}:`, (error as Error).message);
        errorCount++;
        
        results.push({
          ticketId: analysis.ticketId,
          status: 'error',
          confidence: analysis.confidence,
          error: (error as Error).message,
          reason: `Failed to process: ${(error as Error).message}`
        });
      }
    }

    const endTime = Date.now();

    const summary: BatchTaggingResults = {
      total: analysisResults.length,
      success: successCount,
      skipped: skipCount,
      errors: errorCount,
      details: results
    };

    console.log(`🏷️  Batch tagging complete:`, {
      total: summary.total,
      success: summary.success,
      skipped: summary.skipped,
      errors: summary.errors,
      duration: `${((endTime - startTime) / 1000).toFixed(1)}s`
    });

    return summary;
  }

  /**
   * Generate summary report of tagging operations
   */
  generateReport(results: BatchTaggingResults): string {
    let report = '\n=== AUTO-TAGGING REPORT ===\n\n';
    report += `📊 Summary:\n`;
    report += `   Total Tickets: ${results.total}\n`;
    report += `   ✅ Success: ${results.success}\n`;
    report += `   ⏭️  Skipped: ${results.skipped}\n`;
    report += `   ❌ Errors: ${results.errors}\n\n`;

    if (this.config.dryRun) {
      report += `🔍 DRY RUN MODE - No actual changes were made\n\n`;
    }

    // Tag distribution
    const tagStats = new Map<string, number>();
    results.details.forEach(result => {
      if (result.tags) {
        result.tags.forEach(tag => {
          tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
        });
      }
    });

    if (tagStats.size > 0) {
      report += `🏷️  Most Applied Tags:\n`;
      const sortedTags = [...tagStats.entries()].sort((a, b) => b[1] - a[1]);
      sortedTags.slice(0, 10).forEach(([tag, count]) => {
        report += `   ${tag}: ${count} tickets\n`;
      });
      report += '\n';
    }

    // Errors section
    const errors = results.details.filter(r => r.status === 'error');
    if (errors.length > 0) {
      report += `❌ Errors (${errors.length}):\n`;
      errors.slice(0, 5).forEach(error => {
        report += `   Ticket ${error.ticketId}: ${error.reason || error.error}\n`;
      });
      if (errors.length > 5) {
        report += `   ... and ${errors.length - 5} more\n`;
      }
      report += '\n';
    }

    report += `Configuration:\n`;
    report += `   Min Confidence: ${this.config.minConfidence}\n`;
    report += `   Dry Run: ${this.config.dryRun}\n`;

    return report;
  }

  /**
   * Update automation configuration
   */
  updateConfig(newConfig: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Automation config updated:', newConfig);
  }

  /**
   * Get current automation configuration
   */
  getConfig(): AutomationConfig {
    return { ...this.config };
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AutoTagger;