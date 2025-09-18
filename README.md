# Zendesk Ticket Automation System

## 🚀 Overview

This intelligent automation system automatically fetches, analyzes, and categorizes Zendesk tickets using natural language processing techniques. It helps customer support teams by:

- **Automatically tagging tickets** based on content analysis
- **Categorizing tickets** into predefined categories (technical, billing, account, etc.)
- **Analyzing sentiment** to identify frustrated or satisfied customers
- **Detecting priority levels** based on urgency indicators
- **Identifying product/platform mentions** for better routing
- **Providing comprehensive reporting** and analytics

## 🏗️ Architecture

The system consists of several modular components built with TypeScript:

```
src/
├── index.ts                    # Main entry point and CLI interface (TypeScript)
├── types/
│   └── index.ts               # Comprehensive type definitions
├── services/
│   ├── zendeskClient.ts       # Zendesk API client with authentication
│   ├── ticketFetcher.ts       # Ticket retrieval and filtering logic
│   ├── contentAnalyzer.ts     # NLP-based content analysis engine
│   └── autoTagger.ts          # Automatic tagging and ticket updates
└── utils/
    ├── logger.ts              # Comprehensive logging system
    └── errorHandler.ts        # Error handling and retry mechanisms

dist/                          # Compiled JavaScript output
create-demo-tickets.js         # Demo ticket creation utility
find-subdomain.js             # Connection testing utility
```

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

## 🔨 Development & Building

### TypeScript Compilation

This project is built with TypeScript and needs to be compiled before running:

**Build once**:
```bash
npm run build
```

**Build and run**:
```bash
npm start  # This automatically builds and runs
```

**Development workflow**:
```bash
# Build in watch mode (rebuilds on file changes)
npm run build -- --watch

# In another terminal, run the compiled code
node dist/index.js
```

### Project Structure
- **Source**: `src/` - TypeScript source files
- **Output**: `dist/` - Compiled JavaScript files
- **Types**: `src/types/` - TypeScript type definitions

### Scripts Available
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and run the application
- `npm test` - Run system tests

## 🎯 Use Cases Solved

### 1. Automatic Ticket Triage
- **Problem**: Support agents spend time manually categorizing and routing tickets
- **Solution**: AI-powered analysis automatically assigns relevant tags and categories
- **Benefit**: Reduces manual work and ensures consistent categorization

### 2. Priority Detection
- **Problem**: Urgent tickets may get lost in the queue
- **Solution**: Automatic detection of urgency indicators and priority assignment
- **Benefit**: Critical issues get faster attention

### 3. Sentiment Analysis
- **Problem**: Frustrated customers need special attention
- **Solution**: Automatic sentiment detection and appropriate tagging
- **Benefit**: Enables proactive customer retention efforts

### 4. Product-Based Routing
- **Problem**: Tickets need to be routed to correct specialist teams
- **Solution**: Automatic detection of product/platform mentions
- **Benefit**: Faster resolution through proper routing

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