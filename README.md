# Zendesk Ticket Automation System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Zendesk API](https://img.shields.io/badge/Zendesk-API-green?style=for-the-badge)](https://developer.zendesk.com/)

## 🚀 Overview

This intelligent automation system combines **automatic ticket processing** with a **real-time Slack bot agent** to provide comprehensive customer support automation. The system:

### 🤖 Automatic Ticket Processing
- **Automatically tags tickets** based on content analysis
- **Categorizes tickets** into predefined categories (technical, billing, account, etc.)
- **Analyzes sentiment** to identify frustrated or satisfied customers
- **Detects priority levels** based on urgency indicators
- **Identifies product/platform mentions** for better routing
- **Provides comprehensive reporting** and analytics

### 💬 Intelligent Slack Bot Agent
- **Real-time FAQ lookup** with Zendesk Help Center integration
- **Create and manage tickets** directly from Slack
- **Interactive help system** with contextual responses
- **Automatic notifications** when tickets are processed
- **Seamless team collaboration** without leaving Slack

## 🏗️ Architecture

This system is built with a **dual-purpose architecture** that combines automated ticket processing with real-time Slack bot capabilities:

### 🎯 **Core Components**

#### 1. **Ticket Automation Engine** (`src/index.ts`)
- Main CLI interface and automation orchestration
- Batch processing with configurable parameters
- Comprehensive reporting and analytics

#### 2. **Slack Bot Agent** (`src/slackAgentRunner.ts`)
- Continuous polling for Slack messages
- Real-time command processing
- Interactive FAQ and ticket management

#### 3. **Zendesk Integration Layer**
- **API Client** (`src/services/zendeskClient.ts`) - Authentication and request handling
- **Ticket Fetcher** (`src/services/ticketFetcher.ts`) - Ticket retrieval and filtering
- **Auto Tagger** (`src/services/autoTagger.ts`) - Intelligent tagging system

#### 4. **Slack Integration Layer**
- **Slack Agent** (`src/services/slackAgent.ts`) - Command parsing and FAQ lookup
- **Slack Notifier** (`src/services/slackNotifier.ts`) - Automated notifications

#### 5. **Intelligence Layer**
- **Content Analyzer** (`src/services/contentAnalyzer.ts`) - NLP-based analysis engine
- **Category Detection** - Technical, billing, account management classification
- **Sentiment Analysis** - Customer satisfaction assessment
- **Priority Detection** - Urgency level identification

### 📁 **Project Structure**

```
src/
├── index.ts                    # 🚀 Main automation entry point & CLI
├── slackAgentRunner.ts         # 🤖 Slack bot continuous polling agent
├── types/
│   └── index.ts               # 📝 Comprehensive TypeScript definitions
├── services/
│   ├── zendeskClient.ts       # 🔐 Zendesk API client & authentication
│   ├── ticketFetcher.ts       # 📥 Ticket retrieval & filtering logic
│   ├── contentAnalyzer.ts     # 🧠 NLP-based content analysis engine
│   ├── autoTagger.ts          # 🏷️  Automatic tagging & ticket updates
│   ├── slackAgent.ts          # 💬 Slack bot command processing & FAQ
│   └── slackNotifier.ts       # 📢 Slack notification sender
└── utils/
    ├── logger.ts              # 📊 Comprehensive logging system
    └── errorHandler.ts        # 🛡️ Error handling & retry mechanisms

dist/                          # 📦 Compiled JavaScript output
create-demo-tickets.js         # 🎫 Demo ticket creation utility
find-subdomain.js             # 🔍 Connection testing utility
.env                          # 🔒 Environment configuration
```

### 🔄 **Data Flow Architecture**

#### **Automation Pipeline**
```mermaid
graph LR
    A[CLI Start] --> B[Fetch Tickets]
    B --> C[Content Analysis]
    C --> D[Generate Tags]
    D --> E[Apply Tags]
    E --> F[Slack Notification]
    F --> G[Generate Report]
```

#### **Slack Bot Pipeline**
```mermaid
graph LR
    H[Slack Message] --> I[Command Parser]
    I --> J{Command Type}
    J -->|FAQ| K[Zendesk Help Center API]
    J -->|Create| L[Zendesk Tickets API]
    J -->|Update| M[Zendesk Tickets API]
    K --> N[Reply to Slack]
    L --> N
    M --> N
```

### 🔗 **Integration Points**

#### **External APIs**
- **Zendesk API v2** - Ticket management and Help Center search
- **Slack Web API** - Bot interactions and notifications

#### **Internal Communication**
- **Shared Zendesk Client** - Common authentication and rate limiting
- **Unified Logging** - Centralized logging across all components
- **Environment Configuration** - Single `.env` for all services

### ⚡ **Runtime Modes**

#### **Automation Mode** (`npm start`)
- Batch processing of existing tickets
- Intelligent tagging and categorization
- Slack notifications for processed tickets
- Comprehensive reporting

#### **Bot Mode** (`node dist/slackAgentRunner.js`)
- Continuous Slack channel monitoring
- Real-time FAQ responses
- Interactive ticket creation and management
- Thread-based replies for organization

#### **Combined Mode** (Both running)
- Full-featured customer support automation
- Proactive ticket processing + reactive bot support
- Seamless integration between automated and manual workflows

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ (for ES modules support)
- Zendesk account with API access
- API token for authentication

### Installation

1. **Clone or download the project**:
   ```bash
   git clone https://github.com/marcusicaro/zendesk_automation.git
   cd zendesk_automation
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   The `.env` file should already contain your credentials:
   ```env
   ZENDESK_EMAIL=your-email@domain.com
   ZENDESK_TOKEN=your-api-token
   ZENDESK_SUBDOMAIN=your-zendesk-subdomain
   ```

4. **Create log directories** (if not already present):
   ```bash
   mkdir -p logs
   ```

5. **Build the TypeScript project**:
   ```bash
   npm run build
   ```

## 🚀 Quick Start

### Run Main Automation
```bash
npm start
```

### Start Slack Bot Agent
```bash
node dist/slackAgentRunner.js
```

### Test Commands in Slack
Once the bot is running, try these commands in your Slack channel:
- `help` - Show available commands
- `faq billing` - Search billing FAQ  
- `ticket create Test | This is a test ticket` - Create a test ticket

## ⚙️ Environment Variables (.env)

Create a `.env` file in the project root with the following variables:

```
ZENDESK_EMAIL=your-zendesk-email
ZENDESK_TOKEN=your-zendesk-api-token
ZENDESK_SUBDOMAIN=your-zendesk-subdomain
SLACK_TOKEN=your-slack-bot-token
SLACK_CHANNEL=your-slack-channel-id
LOG_LEVEL=info
```

- `ZENDESK_EMAIL`, `ZENDESK_TOKEN`, `ZENDESK_SUBDOMAIN`: Required for Zendesk API access
- `SLACK_TOKEN`: Slack Bot Token (create a Slack app and add chat:write permission)
- `SLACK_CHANNEL`: Channel ID to post notifications (e.g. C12345678)
- `LOG_LEVEL`: Logging verbosity (optional)

## 🤖 Intelligent Slack Bot Integration

This system includes a powerful **Slack bot agent** that provides real-time customer support capabilities directly in your Slack workspace. The bot can handle FAQ queries, create and update Zendesk tickets, and provide help—all through simple chat commands.

### 🌟 Bot Features

#### 📚 FAQ & Knowledge Base Search
- **Real-time FAQ lookup** using Zendesk Help Center API
- **Intelligent keyword matching** with fallback answers
- **Comprehensive knowledge base** covering common support topics

#### 🎫 Ticket Management
- **Create tickets directly from Slack** with subject and description
- **Update ticket status** (new, open, pending, solved, closed)
- **Automatic ticket tracking** with clickable links

#### � Interactive Help System
- **Command assistance** with examples and usage patterns
- **Contextual responses** tailored to user queries
- **Error handling** with helpful suggestions

### 🚀 Bot Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show all available commands and examples | `help` |
| `faq [question]` | Search FAQ/Knowledge Base | `faq How do I reset my password?` |
| `ticket create [subject] \| [description]` | Create new Zendesk ticket | `ticket create Login Issue \| Cannot access my account` |
| `ticket update [id] [status]` | Update ticket status | `ticket update 123 solved` |

### 🔧 Bot Setup

#### 1. Create Slack App
1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "Zendesk Support Bot")
4. Select your workspace

#### 2. Configure Bot Permissions
Add these OAuth scopes in "OAuth & Permissions":
- `channels:history` - Read channel messages
- `chat:write` - Send messages
- `channels:read` - List channels
- `users:read` - Read user information

#### 3. Install App to Workspace
1. Click "Install to Workspace"
2. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
3. Add to your `.env` file as `SLACK_TOKEN`

#### 4. Get Channel ID
1. Open Slack, right-click your target channel
2. Select "Copy link"
3. Extract the channel ID from the URL (e.g., `C09GE0NLJLR`)
4. Add to your `.env` file as `SLACK_CHANNEL`

#### 5. Invite Bot to Channel
In your target channel, type: `/invite @YourBotName`

### 📱 Bot Usage Examples

#### FAQ Queries
```
User: faq billing
Bot: 💳 Billing Information
For billing questions:
• Visit the Billing section in your account settings
• Contact billing support at billing@company.com
• View your invoices in the dashboard under "Billing History"
```

#### Creating Tickets
```
User: ticket create Login Issue | Cannot access my account after password reset
Bot: ✅ Ticket created successfully!
ID: 124
Subject: Login Issue
Status: new
URL: https://yoursubdomain.zendesk.com/agent/tickets/124
```

#### Updating Tickets
```
User: ticket update 124 solved
Bot: ✅ Ticket updated successfully!
ID: 124
Status: solved
URL: https://yoursubdomain.zendesk.com/agent/tickets/124
```

### 🏃‍♂️ Running the Bot

#### Start the Bot Agent
```bash
# Build the project first
npm run build

# Start the Slack bot agent (runs continuously)
node dist/slackAgentRunner.js
```

The bot will:
- ✅ **Monitor your Slack channel** every 5 seconds
- ✅ **Process new messages** with commands
- ✅ **Reply in threads** to keep channels clean
- ✅ **Handle errors gracefully** with helpful messages
- ✅ **Integrate with Zendesk API** for real ticket operations

#### Integration with Main Automation
When the main automation tags tickets, **notifications are automatically sent to Slack**:

```bash
# Run main automation (also sends Slack notifications)
npm start
```

### 🎯 Real-World Bot Scenarios

#### Customer Support Workflow
1. **Customer asks FAQ** → Bot provides instant answer
2. **Complex issue** → Bot creates ticket for human agent
3. **Agent resolves** → Bot updates ticket status
4. **Follow-up needed** → Agent uses bot to check ticket status

#### Team Collaboration
- **Support agents** can create tickets without leaving Slack
- **Managers** can update ticket statuses for reporting
- **Everyone** gets instant access to FAQ knowledge base

### 🔔 Automatic Slack Notifications

When the main automation system processes and tags tickets, a summary notification is automatically sent to your configured Slack channel:

```
🎫 Zendesk Automation Summary
📥 Processed: 5 tickets
🏷️ Tagged: 3 tickets  
⏭️ Skipped: 2 tickets
✅ Success Rate: 100%
```

## ⚙️ Environment Variables (.env)

Create a `.env` file in the project root with the following variables:

```env
# Zendesk Configuration (Required)
ZENDESK_EMAIL=your-zendesk-email
ZENDESK_TOKEN=your-zendesk-api-token
ZENDESK_SUBDOMAIN=your-zendesk-subdomain

# Slack Bot Configuration (Required for bot features)
SLACK_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL=C1234567890

# Optional Settings
LOG_LEVEL=info
```

### Configuration Details

#### Zendesk Settings (Required)
- `ZENDESK_EMAIL`: Your Zendesk account email
- `ZENDESK_TOKEN`: API token from Zendesk Admin → Apps & Integrations → APIs → Zendesk API
- `ZENDESK_SUBDOMAIN`: Your Zendesk URL subdomain (if your URL is `company.zendesk.com`, use `company`)

#### Slack Bot Settings (Required for bot)
- `SLACK_TOKEN`: Bot User OAuth Token from Slack App (starts with `xoxb-`)
- `SLACK_CHANNEL`: Target channel ID (get from channel link, starts with `C`)

#### Optional Settings
- `LOG_LEVEL`: Logging verbosity (`debug`, `info`, `warn`, `error`)

---

## 🔨 Development & Building

### TypeScript Compilation

This project is built with TypeScript and needs to be compiled before running:

**Build once**:
```bash
npm run build
```

**Build and run**:
```bash
npm start  # This automatically builds and runs the main automation
```

**Development workflow**:
```bash
# Build in watch mode (rebuilds on file changes)
npm run build -- --watch

# In another terminal, run the compiled code
node dist/index.js
```

### Project Structure
```
src/
├── index.ts                    # Main automation entry point
├── slackAgentRunner.ts         # Slack bot continuous polling
├── types/
│   └── index.ts               # TypeScript type definitions
├── services/
│   ├── zendeskClient.ts       # Zendesk API client
│   ├── ticketFetcher.ts       # Ticket retrieval logic
│   ├── contentAnalyzer.ts     # NLP-based analysis
│   ├── autoTagger.ts          # Automatic tagging
│   ├── slackNotifier.ts       # Slack notifications
│   └── slackAgent.ts          # Slack bot agent logic
└── utils/
    ├── logger.ts              # Comprehensive logging
    └── errorHandler.ts        # Error handling

dist/                          # Compiled JavaScript output
create-demo-tickets.js         # Demo ticket creation utility
find-subdomain.js             # Connection testing utility
```

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and run the main automation
- `npm test` - Run system tests
- `node dist/slackAgentRunner.js` - Start Slack bot agent

## 🎯 Use Cases Solved

### 1. Automatic Ticket Triage
- **Problem**: Support agents spend time manually categorizing and routing tickets
- **Solution**: AI-powered analysis automatically assigns relevant tags and categories
- **Benefit**: Reduces manual work and ensures consistent categorization

### 2. Priority Detection  
- **Problem**: Urgent tickets may get lost in the queue
- **Solution**: Automatic detection of urgency indicators and priority assignment
- **Benefit**: Critical issues get faster attention

### 3. Real-time Slack Support
- **Problem**: Support teams need quick access to FAQ and ticket management
- **Solution**: Intelligent Slack bot with FAQ lookup and ticket operations
- **Benefit**: Instant support without leaving Slack workspace

## 🚦 Usage

### Basic Usage

**Run with default settings** (analyzes last 24 hours):
```bash
npm start
```

**Dry run** (preview changes without applying):
```bash
npm start -- --dry-run
```

**Test the system**:
```bash
npm start -- --test
```

**Analyze specific time period**:
```bash
npm start -- --hours-back 48  # Last 48 hours
```

### Advanced Usage

**High confidence tagging only**:
```bash
npm start -- --confidence 0.8
```

**Combined options**:
```bash
npm start -- --dry-run --confidence 0.5 --hours-back 72
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without applying them | false |
| `--test` | Run system test | - |
| `--confidence <number>` | Minimum confidence for tagging (0-1) | 0.7 |
| `--hours-back <number>` | Hours back to search for tickets | 24 |
| `--status <status>` | Filter tickets by status (new, open, pending, etc.) | - |
| `--help, -h` | Show help message | - |

## 🧠 How It Works

### 1. Ticket Fetching
- Connects to Zendesk API using provided credentials
- Fetches recent tickets based on time criteria
- Filters out already processed tickets (tagged with `auto-processed`)
- Retrieves detailed ticket information including comments

### 2. Content Analysis
The system analyzes ticket content using multiple techniques:

#### Category Detection
- **Technical Issues**: Keywords like "bug", "error", "crash", "not working"
- **Billing & Payment**: "billing", "payment", "invoice", "refund"
- **Account Management**: "login", "password", "account", "security"
- **Feature Requests**: "feature request", "enhancement", "suggestion"
- **General Support**: "help", "question", "how to", "tutorial"
- **Sales & Pre-sales**: "demo", "trial", "purchase", "pricing"

#### Priority Analysis
- **Urgent**: "urgent", "emergency", "critical", "down", "production"
- **High**: "important", "business impact", "deadline"
- **Low**: "when you have time", "minor", "suggestion"

#### Sentiment Detection
- **Positive**: "great", "excellent", "amazing", "love"
- **Negative**: "frustrated", "angry", "terrible", "hate"

#### Product/Platform Detection
- **Mobile**: "mobile", "app", "ios", "android"
- **Web**: "website", "browser", "web app"
- **API**: "api", "endpoint", "integration"
- **Desktop**: "desktop", "windows", "mac"

### 3. Tag Application
Based on analysis results, the system applies relevant tags:

- `auto-processed` - Marks ticket as processed
- `category-{type}` - Primary category (e.g., `category-technical`)
- `priority-{level}` - Priority level (e.g., `priority-urgent`)
- `sentiment-{type}` - Sentiment (e.g., `sentiment-negative`)
- `product-{type}` - Product mention (e.g., `product-mobile`)
- Special tags like `needs-technical-review`, `billing-inquiry`

### 4. Quality Controls
- **Confidence scoring**: Only applies tags when confidence exceeds threshold
- **Rate limiting**: Respects Zendesk API rate limits with delays between batches
- **Error handling**: Comprehensive retry mechanisms for failed operations
- **Logging**: Detailed logs for monitoring and debugging

## 📊 Reporting & Analytics

### Real-time Console Output
```
🤖 ZENDESK AUTOMATION SUMMARY REPORT
============================================================
⏱️  Duration: 45s
📊 Tickets Processed: 23
🏷️  Tickets Tagged: 19
⏭️  Tickets Skipped: 3
❌ Errors: 1
✅ Success Rate: 83%
============================================================
```

### Detailed Logging
All operations are logged to files in the `logs/` directory:
- `combined.log` - All log entries
- `error.log` - Error messages only
- `automation.log` - Automation-specific events

### Programmatic Access
```javascript
import { TicketAutomationSystem } from './dist/index.js';

const automation = new TicketAutomationSystem({
  dryRun: true,
  minConfidence: 0.5,
  hoursBack: 48
});

const report = await automation.run();
console.log(report.summary);
```

## 🔧 Configuration

### Environment Variables
- `ZENDESK_EMAIL` - Your Zendesk email address
- `ZENDESK_TOKEN` - Your Zendesk API token
- `ZENDESK_SUBDOMAIN` - Your Zendesk subdomain
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `NODE_ENV` - Environment (development, production)

### Runtime Configuration
```javascript
const config = {
  hoursBack: 24,           // Hours to look back for tickets
  batchSize: 5,            // Parallel processing batch size
  delayBetweenBatches: 2000, // Delay in ms between batches
  dryRun: false,           // Preview mode
  minConfidence: 0.3,      // Minimum confidence for tagging
  maxTags: 8,              // Maximum tags per ticket
  enablePriorityUpdate: false, // Enable priority updates
  enableReporting: true    // Enable console reporting
};
```

## 🛡️ Error Handling

The system includes comprehensive error handling:

### Retry Mechanisms
- **Exponential backoff** for transient failures
- **Circuit breaker pattern** for repeated failures
- **Rate limit handling** with automatic delays

### Error Categories
- **API Errors**: Authentication, rate limits, server errors
- **Network Errors**: Connection timeouts, DNS issues
- **Data Errors**: Invalid ticket data, parsing failures

### Recovery Strategies
- Automatic retries for transient errors
- Graceful degradation for non-critical failures
- Detailed error logging for debugging

## 🔐 Security Considerations

- API credentials are stored securely in environment variables
- No sensitive data is logged
- Rate limiting prevents API abuse
- Input validation prevents injection attacks

## 📈 Performance

### Scalability
- Batch processing minimizes API calls
- Configurable batch sizes for different workloads
- Memory-efficient streaming processing

### Monitoring
- Real-time progress indicators
- Performance metrics logging
- Error rate tracking

## 🧪 Testing

### Dry Run Mode
Test the system without making changes:
```bash
npm start -- --dry-run --hours-back 1
```

### Sample Output
```
🧪 DRY RUN - Would apply tags to ticket 12345: ["auto-processed", "category-technical", "priority-high"]
```

## 🚨 Troubleshooting

### Common Issues

**Authentication Errors (401)**:
- Verify ZENDESK_EMAIL and ZENDESK_TOKEN in .env
- Check that the API token is active

**Rate Limiting (429)**:
- System automatically handles rate limits
- Reduce batch size if persistent issues occur

**Ticket Not Found Errors (404)**:
- **Cause**: Tickets found in search may be deleted, merged, or access restricted before detailed fetch
- **Normal Behavior**: System logs these errors and continues processing other tickets
- **Example**: `Error fetching detailed ticket 41192338468251: Failed to fetch ticket... 404`
- **Action Required**: None - this is expected behavior in active Zendesk environments

**No Tickets Found**:
- Check the time range (--hours-back parameter)
- Verify tickets exist in the specified period
- Ensure tickets aren't already tagged with 'auto-processed'
- Some tickets may have been processed in previous runs

**Low Confidence Scores**:
- Reduce minimum confidence (--confidence parameter)
- Review content analysis keywords for your domain
- Check ticket content quality and length

### Debug Mode
Enable detailed logging:
```bash
LOG_LEVEL=debug npm start
```

## 🔄 Continuous Deployment

For production deployment:

1. **Set up process manager**:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name zendesk-automation -- --continuous 60
   ```

2. **Configure monitoring**:
   ```bash
   pm2 monitor
   ```

3. **Set up log rotation**:
   ```bash
   pm2 install pm2-logrotate
   ```

## 📝 Customization

### Adding New Categories
Modify `src/services/contentAnalyzer.js`:

```javascript
this.categoryKeywords = {
  // Add new category
  security: {
    keywords: ['security', 'breach', 'hack', 'vulnerability'],
    weight: 3
  }
  // ... existing categories
};
```

### Custom Tag Rules
Extend the tag generation logic in `generateTags()` method:

```javascript
// Add custom business logic
if (analysis.categories.some(c => c.category === 'security')) {
  tags.push('escalate-immediately');
}
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

### Code Style
- Use ES6+ features
- Follow JSDoc conventions
- Maintain error handling patterns
- Add comprehensive logging

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in the `logs/` directory
3. Enable debug logging for detailed information
4. Contact support with log files and error details

---

**Built with ❤️ for efficient customer support automation**