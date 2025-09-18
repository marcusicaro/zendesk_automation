import type {
  ZendeskTicket,
  TicketAnalysis,
  CategoryAnalysis,
  PriorityAnalysis,
  SentimentAnalysis,
  ProductAnalysis,
  CategoryKeywords,
  PriorityKeywords,
  SentimentKeywords,
  ProductKeywords
} from '../types/index.js';

/**
 * Content Analysis Engine
 * Analyzes ticket content to categorize and tag tickets automatically
 */
class ContentAnalyzer {
  private categoryKeywords: CategoryKeywords;
  private priorityKeywords: PriorityKeywords;
  private sentimentKeywords: SentimentKeywords;
  private productKeywords: ProductKeywords;

  constructor() {
    // Define keyword patterns for different categories
    this.categoryKeywords = {
      // Technical Issues
      technical: {
        keywords: [
          'bug', 'error', 'crash', 'broken', 'not working', 'malfunction',
          'technical issue', 'system down', 'outage', 'server', 'api',
          'integration', 'database', 'connection', 'timeout', 'performance',
          'slow loading', 'loading time', 'latency', '500 error', '404 error'
        ],
        weight: 2
      },

      // Billing & Payment
      billing: {
        keywords: [
          'billing', 'payment', 'invoice', 'charge', 'refund', 'subscription',
          'credit card', 'transaction', 'receipt', 'price', 'cost', 'fee',
          'upgrade', 'downgrade', 'plan', 'pricing', 'discount', 'promo code'
        ],
        weight: 2
      },

      // Account Management
      account: {
        keywords: [
          'account', 'login', 'password', 'forgot password', 'reset password',
          'username', 'profile', 'settings', 'security', 'two-factor',
          'verification', 'email change', 'phone number', 'personal information'
        ],
        weight: 2
      },

      // Feature Requests
      feature_request: {
        keywords: [
          'feature request', 'new feature', 'enhancement', 'suggestion',
          'improvement', 'would like', 'wish', 'could you add', 'missing',
          'please add', 'request', 'enhancement'
        ],
        weight: 2
      },

      // General Support
      support: {
        keywords: [
          'help', 'question', 'how to', 'tutorial', 'guide', 'documentation',
          'instructions', 'explain', 'clarification', 'confused', 'understand'
        ],
        weight: 1
      },

      // Sales & Pre-sales
      sales: {
        keywords: [
          'sales', 'demo', 'trial', 'purchase', 'buy', 'quote', 'pricing',
          'enterprise', 'business plan', 'custom plan', 'consultation',
          'pre-sales', 'product information'
        ],
        weight: 2
      }
    };

    // Priority indicators
    this.priorityKeywords = {
      urgent: {
        keywords: [
          'urgent', 'emergency', 'critical', 'asap', 'immediately', 'down',
          'broken', 'not working', 'production', 'live site', 'revenue impact',
          'security breach', 'data loss', 'urgent help needed'
        ],
        weight: 3
      },
      high: {
        keywords: [
          'important', 'priority', 'business impact', 'customer facing',
          'deadline', 'time sensitive', 'blocking', 'major issue'
        ],
        weight: 2
      },
      low: {
        keywords: [
          'when you have time', 'no rush', 'minor', 'cosmetic', 'nice to have',
          'suggestion', 'feedback', 'general question'
        ],
        weight: 1
      }
    };

    // Sentiment keywords
    this.sentimentKeywords = {
      negative: [
        'frustrated', 'angry', 'disappointed', 'terrible', 'awful', 'horrible',
        'worst', 'hate', 'useless', 'broken', 'fed up', 'unacceptable',
        'ridiculous', 'pathetic', 'disgusted'
      ],
      positive: [
        'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
        'perfect', 'awesome', 'brilliant', 'outstanding', 'impressed',
        'satisfied', 'happy', 'pleased'
      ]
    };

    // Product/service specific keywords
    this.productKeywords = {
      mobile: ['mobile', 'app', 'ios', 'android', 'phone', 'smartphone', 'tablet'],
      web: ['website', 'browser', 'chrome', 'firefox', 'safari', 'edge', 'web app'],
      api: ['api', 'endpoint', 'webhook', 'integration', 'developer', 'sdk'],
      desktop: ['desktop', 'windows', 'mac', 'macos', 'linux', 'software', 'application']
    };
  }

  /**
   * Analyze ticket content and return categorization results
   */
  analyzeTicket(ticket: ZendeskTicket): TicketAnalysis {
    const text = (ticket.fullText || ticket.description || ticket.subject || '').toLowerCase();
    
    const analysis: TicketAnalysis = {
      ticketId: ticket.id,
      categories: this.categorizeContent(text),
      priority: this.analyzePriority(text),
      sentiment: this.analyzeSentiment(text),
      products: this.analyzeProducts(text),
      suggestedTags: [],
      confidence: 0
    };

    // Generate suggested tags based on analysis
    analysis.suggestedTags = this.generateTags(analysis);
    
    // Calculate overall confidence score
    analysis.confidence = this.calculateConfidence(analysis, text);

    return analysis;
  }

  /**
   * Categorize content based on keyword matching
   */
  private categorizeContent(text: string): CategoryAnalysis[] {
    const categories: CategoryAnalysis[] = [];

    for (const [category, config] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          score += config.weight;
          matchedKeywords.push(keyword);
        }
      }

      if (score > 0) {
        categories.push({
          category,
          score,
          matchedKeywords,
          confidence: Math.min(score / 5, 1) // Normalize to 0-1
        });
      }
    }

    // Sort by score (highest first)
    return categories.sort((a, b) => b.score - a.score);
  }

  /**
   * Analyze priority based on urgency keywords
   */
  private analyzePriority(text: string): PriorityAnalysis {
    let highestPriority: 'urgent' | 'high' | 'normal' | 'low' = 'normal';
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const [priority, config] of Object.entries(this.priorityKeywords)) {
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          if (config.weight > score) {
            highestPriority = priority as 'urgent' | 'high' | 'normal' | 'low';
            score = config.weight;
          }
          matchedKeywords.push(keyword);
        }
      }
    }

    return {
      level: highestPriority,
      score,
      matchedKeywords,
      confidence: score > 0 ? Math.min(score / 3, 1) : 0.5
    };
  }

  /**
   * Analyze sentiment of the text
   */
  private analyzeSentiment(text: string): SentimentAnalysis {
    let positiveScore = 0;
    let negativeScore = 0;
    const positiveWords: string[] = [];
    const negativeWords: string[] = [];

    // Count positive sentiment words
    for (const word of this.sentimentKeywords.positive) {
      if (text.includes(word)) {
        positiveScore++;
        positiveWords.push(word);
      }
    }

    // Count negative sentiment words
    for (const word of this.sentimentKeywords.negative) {
      if (text.includes(word)) {
        negativeScore++;
        negativeWords.push(word);
      }
    }

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 0;

    if (negativeScore > positiveScore) {
      sentiment = 'negative';
      score = negativeScore - positiveScore;
    } else if (positiveScore > negativeScore) {
      sentiment = 'positive';
      score = positiveScore - negativeScore;
    }

    return {
      sentiment,
      score,
      positiveWords,
      negativeWords,
      confidence: Math.min((positiveScore + negativeScore) / 3, 1)
    };
  }

  /**
   * Identify product/platform mentions
   */
  private analyzeProducts(text: string): ProductAnalysis[] {
    const products: ProductAnalysis[] = [];

    for (const [product, keywords] of Object.entries(this.productKeywords)) {
      const matchedKeywords = keywords.filter(keyword => text.includes(keyword));
      
      if (matchedKeywords.length > 0) {
        products.push({
          product,
          matchedKeywords,
          confidence: Math.min(matchedKeywords.length / keywords.length, 1)
        });
      }
    }

    return products.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate suggested tags based on analysis results
   */
  private generateTags(analysis: TicketAnalysis): string[] {
    const tags = ['auto-processed']; // Always add this to mark as processed

    // Add category tags
    if (analysis.categories.length > 0) {
      const topCategory = analysis.categories[0];
      if (topCategory && topCategory.confidence > 0.3) {
        tags.push(`category-${topCategory.category}`);
      }
    }

    // Add priority tags
    if (analysis.priority.level !== 'normal' && analysis.priority.confidence > 0.5) {
      tags.push(`priority-${analysis.priority.level}`);
    }

    // Add sentiment tags
    if (analysis.sentiment.sentiment !== 'neutral' && analysis.sentiment.confidence > 0.4) {
      tags.push(`sentiment-${analysis.sentiment.sentiment}`);
    }

    // Add product tags
    if (analysis.products.length > 0) {
      const topProduct = analysis.products[0];
      if (topProduct && topProduct.confidence > 0.3) {
        tags.push(`product-${topProduct.product}`);
      }
    }

    // Add specific tags based on high-confidence categories
    for (const category of analysis.categories) {
      if (category.confidence > 0.6) {
        switch (category.category) {
          case 'technical':
            tags.push('needs-technical-review');
            break;
          case 'billing':
            tags.push('billing-inquiry');
            break;
          case 'feature_request':
            tags.push('feature-request');
            break;
          case 'account':
            tags.push('account-management');
            break;
        }
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate overall confidence score for the analysis
   */
  private calculateConfidence(analysis: TicketAnalysis, text: string): number {
    let totalConfidence = 0;
    let factors = 0;

    // Factor in category confidence
    if (analysis.categories.length > 0) {
      totalConfidence += analysis.categories[0]?.confidence || 0;
      factors++;
    }

    // Factor in priority confidence
    totalConfidence += analysis.priority.confidence;
    factors++;

    // Factor in sentiment confidence
    totalConfidence += analysis.sentiment.confidence;
    factors++;

    // Factor in text length (longer text generally provides more confidence)
    const textLengthFactor = Math.min(text.length / 500, 1);
    totalConfidence += textLengthFactor;
    factors++;

    return factors > 0 ? totalConfidence / factors : 0;
  }

  /**
   * Batch analyze multiple tickets
   */
  batchAnalyze(tickets: ZendeskTicket[]): TicketAnalysis[] {
    console.log(`🔍 Analyzing ${tickets.length} tickets...`);
    
    const results = tickets.map(ticket => {
      try {
        return this.analyzeTicket(ticket);
      } catch (error) {
        console.error(`Error analyzing ticket ${ticket.id}:`, (error as Error).message);
        return {
          ticketId: ticket.id,
          error: (error as Error).message,
          categories: [],
          priority: { level: 'normal' as const, confidence: 0, score: 0, matchedKeywords: [] },
          sentiment: { sentiment: 'neutral' as const, confidence: 0, score: 0, positiveWords: [], negativeWords: [] },
          products: [],
          suggestedTags: ['auto-processed', 'analysis-failed'],
          confidence: 0
        };
      }
    });

    console.log(`✅ Analysis complete for ${results.length} tickets`);
    return results;
  }
}

export default ContentAnalyzer;