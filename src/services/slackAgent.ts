import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface SlackAgentConfig {
  token: string;
  channel: string;
}

export interface TicketData {
  subject: string;
  description: string;
  status?: string;
  priority?: string;
}

// Real Zendesk Help Center API search
async function lookupFAQ(question: string): Promise<string> {
  try {
    const subdomain = process.env.ZENDESK_SUBDOMAIN;
    const email = process.env.ZENDESK_EMAIL;
    const token = process.env.ZENDESK_TOKEN;

    if (!subdomain || !email || !token) {
      return 'Zendesk configuration missing. Please check your environment variables.';
    }

    console.log(`🔍 Searching Help Center for: "${question}"`);
    console.log(`📡 API URL: https://${subdomain}.zendesk.com/api/v2/help_center/articles/search.json`);

    // Try to search Help Center articles
    const searchUrl = `https://${subdomain}.zendesk.com/api/v2/help_center/articles/search.json`;
    const response = await axios.get(searchUrl, {
      params: { 
        query: question,
        per_page: 5  // Get more results
      },
      auth: { username: `${email}/token`, password: token },
      timeout: 10000  // 10 second timeout
    });

    console.log(`📊 Help Center API Response:`, {
      status: response.status,
      resultsCount: response.data.results?.length || 0,
      results: response.data.results?.map((r: any) => ({ id: r.id, title: r.title })) || []
    });

    if (response.data.results && response.data.results.length > 0) {
      const article = response.data.results[0];
      console.log(`✅ Found article: ${article.title}`);
      
      // Clean up the body text (remove HTML tags)
      let bodyText = article.body || '';
      bodyText = bodyText.replace(/<[^>]*>/g, ''); // Remove HTML tags
      bodyText = bodyText.replace(/\s+/g, ' ').trim(); // Normalize whitespace
      
      const preview = bodyText.length > 300 ? bodyText.substring(0, 300) + '...' : bodyText;
      
      return `**${article.title}**\n\n${preview}\n\n🔗 Read more: ${article.html_url}`;
    }

    console.log('❌ No articles found in Help Center, trying fallback search...');
    
    // Try a different search approach - search all articles and filter
    const allArticlesUrl = `https://${subdomain}.zendesk.com/api/v2/help_center/articles.json`;
    const allArticlesResponse = await axios.get(allArticlesUrl, {
      params: { per_page: 100 },
      auth: { username: `${email}/token`, password: token },
      timeout: 10000
    });

    if (allArticlesResponse.data.articles && allArticlesResponse.data.articles.length > 0) {
      console.log(`📚 Found ${allArticlesResponse.data.articles.length} total articles, searching manually...`);
      
      const questionLower = question.toLowerCase();
      const matchingArticle = allArticlesResponse.data.articles.find((article: any) => 
        article.title.toLowerCase().includes(questionLower) ||
        questionLower.includes(article.title.toLowerCase()) ||
        (article.body && article.body.toLowerCase().includes(questionLower))
      );

      if (matchingArticle) {
        console.log(`✅ Found matching article: ${matchingArticle.title}`);
        
        let bodyText = matchingArticle.body || '';
        bodyText = bodyText.replace(/<[^>]*>/g, '');
        bodyText = bodyText.replace(/\s+/g, ' ').trim();
        
        const preview = bodyText.length > 300 ? bodyText.substring(0, 300) + '...' : bodyText;
        
        return `**${matchingArticle.title}**\n\n${preview}\n\n🔗 Read more: ${matchingArticle.html_url}`;
      }
    }

    console.log('❌ No matching articles found, using mock FAQs');
    // If no articles found, fall back to mock FAQs
    return getMockFAQAnswer(question);
  } catch (error) {
    console.error('❌ Help Center API error:', {
      message: (error as any).message,
      status: (error as any).response?.status,
      statusText: (error as any).response?.statusText,
      data: (error as any).response?.data
    });
    
    // If Help Center API fails, fall back to mock FAQs
    return getMockFAQAnswer(question);
  }
}

// Mock FAQ answers for when Help Center API is not available
function getMockFAQAnswer(question: string): string {
  const faqs = [
    // Real article topics from your Zendesk
    { keywords: ['distributed', 'systems', 'management'], a: '🏗️ **Best Practices for Distributed Systems Management**\nKey practices include:\n• Implement proper monitoring and observability\n• Use circuit breakers and retry patterns\n• Design for failure and graceful degradation\n• Maintain consistent configuration management\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['global', 'clients', 'support'], a: '🌍 **Strategies for Supporting Global Clients**\nBest strategies include:\n• 24/7 follow-the-sun support model\n• Localized documentation and communication\n• Cultural awareness training for support teams\n• Multi-timezone escalation procedures\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['security', 'certification', 'compliance'], a: '🔒 **Security Certifications and Compliance**\nImportant considerations:\n• SOC 2 Type II compliance\n• GDPR and data privacy requirements\n• Industry-specific certifications (HIPAA, PCI DSS)\n• Regular security audits and assessments\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['customer', 'data', 'safety', 'zendesk'], a: '🛡️ **Ensuring Customer Data Safety in Zendesk**\nKey safety measures:\n• End-to-end encryption of sensitive data\n• Role-based access controls\n• Regular data backup and recovery testing\n• Compliance with international data protection laws\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['dashboard', 'custom', 'sharing'], a: '📊 **Building and Sharing Custom Dashboards**\nBest practices:\n• Focus on actionable metrics\n• Use clear visualizations and consistent formatting\n• Set up automated reports for stakeholders\n• Include drill-down capabilities for detailed analysis\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['data', 'insights', 'clients'], a: '📈 **Leveraging Data Insights Across Clients**\nStrategies include:\n• Implement unified analytics platform\n• Create client-specific dashboards\n• Use predictive analytics for proactive support\n• Establish data sharing agreements and protocols\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['customer', 'satisfaction', 'metrics', 'monitoring'], a: '📋 **Monitoring Key Customer Satisfaction Metrics**\nEssential metrics:\n• CSAT (Customer Satisfaction Score)\n• NPS (Net Promoter Score)\n• First Response Time and Resolution Time\n• Ticket volume trends and escalation rates\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['reports', 'zendesk', 'customize'], a: '📊 **How to Customize Reports in Zendesk**\nCustomization steps:\n• Access Zendesk Explore or Analytics\n• Select appropriate data sources\n• Configure metrics and filters\n• Schedule automated report delivery\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['workflow', 'automation', 'efficiency'], a: '⚡ **Automating Workflows to Improve Efficiency**\nAutomation strategies:\n• Set up trigger-based actions\n• Create workflow templates for common processes\n• Implement approval workflows for complex cases\n• Use API integrations for cross-platform automation\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['ticket', 'automation', 'zendesk', 'best', 'practices'], a: '🎫 **Best Practices for Ticket Automation in Zendesk**\nKey practices:\n• Auto-assign tickets based on skills and workload\n• Set up escalation rules for SLA compliance\n• Use macros for common responses\n• Implement smart routing based on content analysis\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['api', 'authentication', 'permissions'], a: '🔐 **API Authentication and Permissions**\nAuthentication methods:\n• OAuth 2.0 for secure third-party access\n• API tokens for server-to-server communication\n• Role-based permission management\n• Rate limiting and security monitoring\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['crm', 'integration', 'systems'], a: '🔗 **Connecting to Popular CRM Systems**\nIntegration approaches:\n• Native connectors for Salesforce, HubSpot\n• API-based custom integrations\n• Data synchronization strategies\n• Webhook configuration for real-time updates\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['integration', 'maintenance', 'best', 'practices'], a: '🔧 **Best Practices for Maintaining Integrations**\nMaintenance strategies:\n• Regular health checks and monitoring\n• Version control for integration configurations\n• Error handling and recovery procedures\n• Documentation and change management\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    { keywords: ['saas', 'integrate', 'zendesk'], a: '💼 **How to Integrate Your SaaS with Zendesk**\nIntegration steps:\n• Define integration requirements and scope\n• Choose appropriate Zendesk APIs\n• Implement authentication and security\n• Test thoroughly and monitor performance\n\n*Note: This is a mock response. Check your Help Center for the full article.*' },
    
    // Original FAQs
    { keywords: ['reset', 'password', 'forgot'], a: '🔐 **Password Reset**\nTo reset your password:\n1. Go to the login page\n2. Click "Forgot password"\n3. Enter your email address\n4. Check your email for reset instructions' },
    { keywords: ['billing', 'payment', 'invoice', 'charge'], a: '💳 **Billing Information**\nFor billing questions:\n• Visit the Billing section in your account settings\n• Contact billing support at billing@company.com\n• View your invoices in the dashboard under "Billing History"' },
    { keywords: ['api', 'limits', 'rate', 'quota'], a: '🔧 **API Rate Limits**\nZendesk API rate limits:\n• 400 requests per minute for most endpoints\n• 10 requests per minute for search endpoints\n• More info: https://developer.zendesk.com/api-rate-limits' },
    { keywords: ['create', 'ticket', 'support'], a: '🎫 **Creating Tickets**\nTo create a support ticket:\n• Use: `ticket create [subject] | [description]`\n• Example: `ticket create Login Issue | Cannot access my account`\n• You can also create tickets directly in the web interface' },
    { keywords: ['help', 'commands', 'what'], a: '🤖 **Available Commands**\n• `faq [question]` - Search FAQ\n• `ticket create [subject] | [description]` - Create ticket\n• `ticket update [id] [status]` - Update ticket\n• `help` - Show this help' },
    { keywords: ['contact', 'support', 'phone', 'email'], a: '📞 **Contact Support**\n• Email: support@company.com\n• Phone: +1-555-0123\n• Live chat: Available in your dashboard\n• Business hours: Mon-Fri 9AM-5PM EST' },
  ];
  
  const questionLower = question.toLowerCase();
  const found = faqs.find(faq => 
    faq.keywords.some(keyword => questionLower.includes(keyword))
  );
  
  return found ? found.a : '❓ **No FAQ Found**\nSorry, no relevant FAQ found for your question.\n\nTry:\n• `help` for available commands\n• `ticket create [subject] | [description]` to create a support ticket\n• Contact support directly at support@company.com';
}

// Create a new Zendesk ticket
async function createTicket(ticketData: TicketData): Promise<string> {
  try {
    const subdomain = process.env.ZENDESK_SUBDOMAIN;
    const email = process.env.ZENDESK_EMAIL;
    const token = process.env.ZENDESK_TOKEN;

    if (!subdomain || !email || !token) {
      return 'Zendesk configuration missing. Please check your environment variables.';
    }

    const createUrl = `https://${subdomain}.zendesk.com/api/v2/tickets.json`;
    const response = await axios.post(createUrl, {
      ticket: {
        subject: ticketData.subject,
        comment: { body: ticketData.description },
        status: ticketData.status || 'new',
        priority: ticketData.priority || 'normal'
      }
    }, {
      auth: { username: `${email}/token`, password: token }
    });

    const ticket = response.data.ticket;
    return `✅ Ticket created successfully!\n**ID:** ${ticket.id}\n**Subject:** ${ticket.subject}\n**Status:** ${ticket.status}\n**URL:** https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}`;
  } catch (error) {
    console.error('Error creating ticket:', error);
    return 'Error creating ticket. Please try again later.';
  }
}

// Update a Zendesk ticket status
async function updateTicketStatus(ticketId: string, status: string): Promise<string> {
  try {
    const subdomain = process.env.ZENDESK_SUBDOMAIN;
    const email = process.env.ZENDESK_EMAIL;
    const token = process.env.ZENDESK_TOKEN;

    if (!subdomain || !email || !token) {
      return 'Zendesk configuration missing. Please check your environment variables.';
    }

    const updateUrl = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;
    const response = await axios.put(updateUrl, {
      ticket: { status }
    }, {
      auth: { username: `${email}/token`, password: token }
    });

    const ticket = response.data.ticket;
    return `✅ Ticket updated successfully!\n**ID:** ${ticket.id}\n**Status:** ${ticket.status}\n**URL:** https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}`;
  } catch (error) {
    console.error('Error updating ticket:', error);
    return 'Error updating ticket. Please check the ticket ID and try again.';
  }
}

export async function handleSlackFAQ(config: SlackAgentConfig, event: { text: string; user: string; ts: string; }) {
  const text = event.text.toLowerCase().trim();
  let response = '';

  // Help command (without slash to avoid Slack command conflict)
  if (text.includes('help') || text.includes('ajuda') || text === 'help') {
    response = `🤖 **Zendesk Agent Commands:**
• \`faq [question]\` - Search FAQ/Knowledge Base
• \`ticket create [subject] | [description]\` - Create new ticket
• \`ticket update [id] [status]\` - Update ticket status (new, open, pending, solved, closed)
• \`help\` - Show this help message

**Examples:**
• \`faq How do I reset my password?\`
• \`ticket create Login Issue | Cannot access my account\`
• \`ticket update 123 solved\`

*Note: Don't use / before commands to avoid Slack conflicts*`;
  }
  // FAQ lookup (remove slash requirement)
  else if (text.includes('faq')) {
    const question = text.replace(/.*faq/i, '').trim();
    if (question) {
      response = await lookupFAQ(question);
    } else {
      response = 'Please provide a question. Example: `faq How do I reset my password?`';
    }
  }
  // Ticket creation (remove slash requirement)
  else if (text.includes('ticket create')) {
    const ticketText = text.replace(/.*ticket create/i, '').trim();
    const parts = ticketText.split('|').map(p => p.trim());
    
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const [subject, description] = parts;
      response = await createTicket({ subject, description });
    } else {
      response = 'Please provide subject and description. Example: `ticket create Login Issue | Cannot access my account`';
    }
  }
  // Ticket status update (remove slash requirement)
  else if (text.includes('ticket update')) {
    const updateText = text.replace(/.*ticket update/i, '').trim();
    const parts = updateText.split(/\s+/);
    
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const [ticketId, status] = parts;
      const validStatuses = ['new', 'open', 'pending', 'solved', 'closed'];
      
      if (validStatuses.includes(status)) {
        response = await updateTicketStatus(ticketId, status);
      } else {
        response = `Invalid status. Valid statuses: ${validStatuses.join(', ')}`;
      }
    } else {
      response = 'Please provide ticket ID and status. Example: `ticket update 123 solved`';
    }
  }

  // Send response if we have one
  if (response) {
    const url = 'https://slack.com/api/chat.postMessage';
    await axios.post(url, {
      channel: config.channel,
      text: `<@${event.user}> ${response}`,
      thread_ts: event.ts
    }, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      }
    });
  }
}
