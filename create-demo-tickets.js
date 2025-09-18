#!/usr/bin/env node

/**
 * Demo Script - Creates sample tickets to test the automation system
 * This helps demonstrate the system capabilities with real ticket data
 */

import ZendeskClient from './dist/services/zendeskClient.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleTickets = [
  {
    subject: "Login issues with mobile app - urgent help needed",
    description: "I've been trying to log into the mobile app for the past hour but keep getting error messages. This is blocking my work and I need access immediately. The error says 'invalid credentials' but I'm sure my password is correct. Please help ASAP!",
    priority: "normal",
    type: "problem",
    tags: ["mobile"]
  },
  {
    subject: "Billing question about subscription charges",
    description: "Hello, I noticed an unexpected charge on my credit card for $29.99 last month. I thought I was on the free plan. Could you please explain what this charge is for and help me understand my current subscription status? I'd also like to know how to cancel if needed.",
    priority: "normal", 
    type: "question",
    tags: ["billing"]
  },
  {
    subject: "Feature request: Dark mode for the web interface",
    description: "Hi team! I love using your product but I spend a lot of time in the interface during evening hours. Would it be possible to add a dark mode theme? This would really help reduce eye strain and make the experience more comfortable. Many users in our company have requested this enhancement.",
    priority: "low",
    type: "feature_request",
    tags: ["enhancement"]
  },
  {
    subject: "API integration not working - production system down",
    description: "URGENT: Our production system that integrates with your API has been down for 30 minutes. We're getting 500 errors when calling the /api/v2/users endpoint. This is affecting our customers and causing revenue impact. We need immediate technical support to resolve this critical issue.",
    priority: "urgent",
    type: "problem", 
    tags: ["api", "production"]
  },
  {
    subject: "Thank you for the excellent customer service!",
    description: "I just wanted to reach out and thank Sarah from your support team. She helped me resolve my account setup issues yesterday and was incredibly patient and knowledgeable. The whole experience was fantastic and really exceeded my expectations. Keep up the great work!",
    priority: "low",
    type: "question",
    tags: ["feedback"]
  }
];

async function createDemoTickets() {
  console.log('🎭 Creating Demo Tickets for Automation Testing\n');

  try {
    const client = new ZendeskClient();
    
    // Test connection first
    const connectionTest = await client.testConnection();
    if (!connectionTest) {
      throw new Error('Failed to connect to Zendesk API');
    }

    console.log('📝 Creating sample tickets...\n');

    const createdTickets = [];

    for (let i = 0; i < sampleTickets.length; i++) {
      const ticketData = sampleTickets[i];
      
      try {
        console.log(`Creating ticket ${i + 1}: "${ticketData.subject}"`);
        
        const response = await client.client.post('/tickets.json', {
          ticket: {
            subject: ticketData.subject,
            comment: {
              body: ticketData.description
            },
            priority: ticketData.priority,
            type: ticketData.type,
            tags: ticketData.tags,
            status: 'new'
          }
        });

        const ticket = response.data.ticket;
        createdTickets.push(ticket);
        
        console.log(`✅ Created ticket #${ticket.id}`);
        
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to create ticket: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully created ${createdTickets.length} demo tickets!`);
    console.log('\n📋 Created Tickets:');
    
    createdTickets.forEach(ticket => {
      console.log(`   #${ticket.id}: ${ticket.subject}`);
    });

    console.log('\n🤖 Now you can run the automation to see it in action:');
    console.log('   npm start -- --dry-run    # Preview mode');
    console.log('   npm start                 # Apply tags automatically');
    console.log('\n⏱️  Note: Wait a few minutes for tickets to be indexed before running automation');

    return createdTickets;

  } catch (error) {
    console.error('❌ Demo creation failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Authentication failed. Please check:');
      console.log('1. Your .env file has the correct credentials');
      console.log('2. Your API token is valid and active');
      console.log('3. Your email address is correct');
    } else if (error.response?.status === 403) {
      console.log('\n🔧 Permission denied. Please check:');
      console.log('1. Your API token has ticket creation permissions');
      console.log('2. Your account has agent or admin privileges');
    }
    
    process.exit(1);
  }
}

// Run the demo
createDemoTickets();