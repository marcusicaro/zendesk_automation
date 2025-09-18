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

    // Try to search Help Center articles
    const searchUrl = `https://${subdomain}.zendesk.com/api/v2/help_center/articles/search.json`;
    const response = await axios.get(searchUrl, {
      params: { query: question },
      auth: { username: `${email}/token`, password: token }
    });

    if (response.data.results && response.data.results.length > 0) {
      const article = response.data.results[0];
      return `**${article.title}**\n${article.body.substring(0, 300)}...\n\nRead more: ${article.html_url}`;
    }

    // If no articles found, fall back to mock FAQs
    return getMockFAQAnswer(question);
  } catch (error) {
    console.log('Help Center API not available, using mock FAQs:', (error as any).response?.status);
    // If Help Center API fails, fall back to mock FAQs
    return getMockFAQAnswer(question);
  }
}

// Mock FAQ answers for when Help Center API is not available
function getMockFAQAnswer(question: string): string {
  const faqs = [
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
