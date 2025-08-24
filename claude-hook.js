#!/usr/bin/env node

/**
 * Claude Code Hook Script
 * 
 * This script monitors Claude Code output for the phrase "You're absolutely right!"
 * and increments the counter via the API when detected.
 * 
 * Setup:
 * 1. Make sure this script is executable: chmod +x claude-hook.js
 * 2. API configuration is automatically loaded from .env.development.local
 * 3. Configure this as a Claude Code hook
 * 
 * Usage as Claude Code Hook:
 * Add this to your Claude Code settings or use the hook configuration.
 */

const https = require('https');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Set NODE_ENV=production when running as Claude hook
if (!process.env.NODE_ENV) {
  const args = process.argv.slice(2);
  const isTestCommand = args.includes('--test') || args.includes('--test-issue') || args.includes('--help') || args.includes('-h');
  process.env.NODE_ENV = isTestCommand ? 'development' : 'production';
}

// Load environment variables with dotenv from script directory
const scriptDir = path.dirname(path.resolve(__filename));
dotenv.config({ path: path.join(scriptDir, '.env') });
dotenv.config({ path: path.join(scriptDir, `.env.${process.env.NODE_ENV}.local`) });

// Configuration
const API_URL = process.env.COUNTER_API_URL || 'https://your-domain.com/api/increment';
const API_SECRET = process.env.API_SECRET;
const TRIGGER_PHRASE = "You're absolutely right!";
const ISSUE_PATTERN = /(?:now\s+)?i\s+(?:can\s+)?(?:see|understand|get|found|spot|spotted)\s+the\s+(?:issue|problem|bug)/i;

// Validate configuration
if (!API_SECRET) {
  console.error('❌ API_SECRET environment variable is required');
  process.exit(1);
}

let allMessages = [];


function makeAPIRequest(data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(API_URL);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${API_SECRET}`,
        'User-Agent': 'Claude-Code-Hook/1.0'
      }
    };

    // Making API request
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ response, statusCode: res.statusCode });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Track processed messages to prevent duplicates
// Use absolute path to the hook's directory, not the current working directory
const PROCESSED_IDS_FILE = path.join(scriptDir, '.processed-messages.json');

function loadProcessedIds() {
  try {
    if (fs.existsSync(PROCESSED_IDS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROCESSED_IDS_FILE, 'utf8'));
      return new Set(data);
    }
  } catch (error) {
    // Could not load processed message IDs
  }
  return new Set();
}

function saveProcessedIds(processedIds) {
  try {
    fs.writeFileSync(PROCESSED_IDS_FILE, JSON.stringify([...processedIds]));
  } catch (error) {
    // Could not save processed message IDs
  }
}

function processInput() {
  // Load processed IDs from file
  const processedMessageIds = loadProcessedIds();
  
  // Read JSON input from stdin (Claude Code hook format)
  let buffer = '';
  
  process.stdin.on('data', (data) => {
    buffer += data.toString();
  });

  process.stdin.on('end', async () => {
    try {
      // Parse the JSON input from Claude Code
      const hookData = JSON.parse(buffer);

      if (hookData.transcript_path) {
        // Read the JSONL transcript file
        const transcriptContent = fs.readFileSync(hookData.transcript_path, 'utf8');
        const lines = transcriptContent.trim().split('\n');
        
        // Parse each line as JSON and find assistant messages
        const assistantMessages = [];
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.type === 'assistant' && entry.message && entry.message.role === 'assistant') {
              assistantMessages.push(entry);
            }
          } catch (parseError) {
            // Skip invalid lines
          }
        }
        
        // Process all unprocessed assistant messages
        let allApiPromises = [];
        let rightCount = 0;
        let issueCount = 0;
        let lastIssuePhrase = '';
        
        for (const assistantMessage of assistantMessages) {
          const messageId = assistantMessage.uuid;
          const message = assistantMessage.message;
          
          // Skip if we've already processed this message
          if (processedMessageIds.has(messageId)) {
            continue;
          }

          // Extract text content from the message
          let textContent = '';
          if (message.content && Array.isArray(message.content)) {
            textContent = message.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join(' ');
          }
          
          // Check for "absolutely right" phrase
          if (textContent.includes(TRIGGER_PHRASE)) {
            const matches = (textContent.match(new RegExp(TRIGGER_PHRASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            rightCount += matches;
            
            for (let i = 0; i < matches; i++) {
              allApiPromises.push(makeAPIRequest({type: 'right'}));
            }
          }
          
          // Check for issue detection phrases
          const issueMatches = textContent.match(ISSUE_PATTERN);
          if (issueMatches && issueMatches.length > 0) {
            issueCount++;
            lastIssuePhrase = issueMatches[0];
            allApiPromises.push(makeAPIRequest({type: 'issue'}));
          }
          
          // Mark this message as processed
          processedMessageIds.add(messageId);
        }
        
        // Build accumulated messages
        if (rightCount > 0) {
          allMessages.push(`🎯 Detected "${TRIGGER_PHRASE}" ${rightCount} time(s)!`);
        }
        if (issueCount > 0) {
          if (issueCount === 1) {
            allMessages.push(`🔍 Detected issue phrase: "${lastIssuePhrase}"!`);
          } else {
            allMessages.push(`🔍 Detected ${issueCount} issue phrases!`);
          }
        }
        
        // Wait for all API requests to complete
        if (allApiPromises.length > 0) {
          await Promise.all(allApiPromises).catch(error => allMessages.push(`Error getting API responses: ${error}`));
        }
        
        // Save processed IDs
        saveProcessedIds(processedMessageIds);
        
        // Output JSON message for Claude Code display
        if (allMessages.length > 0) {
          const combinedMessage = allMessages.join('\n');
          console.log(JSON.stringify({
            continue: false,
            stopReason: combinedMessage
          }));
        }
        
        process.exit(0);
      }
    } catch (error) {
      // Output JSON message for Claude Code display
      console.log(JSON.stringify({
          continue: false,
          stopReason: `Failed to parse claude outputs\n${error}\n\n`
        }));
      process.exit(0);
    }
  });
}

// Handle CLI usage for testing
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    console.log('🧪 Testing right counter increment...');
    makeAPIRequest({ type: "right" }).then(() => process.exit(0)).catch((err) => {
      console.error('Test failed:', err);
      process.exit(1);
    });
  } else if (args.includes('--test-issue')) {
    console.log('🧪 Testing issue counter increment...');
    makeAPIRequest({ type: "issue" }).then(() => process.exit(0)).catch((err) => {
      console.error('Test failed:', err);
      process.exit(1);
    });
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Claude Code Hook - Claude Phrase Tracker

Environment Variables:
  COUNTER_API_URL      API endpoint for both phrase types (default: https://your-domain.com/api/increment)
  API_SECRET           API secret token (required)

Tracked Phrases:
  - "You're absolutely right!"
  - "I can see the issue" (and variations)

Usage:
  node claude-hook.js               # Run as hook (reads from stdin)
  node claude-hook.js --test        # Test "absolutely right" counter API
  node claude-hook.js --test-issue  # Test issue detection counter API
  node claude-hook.js --help        # Show this help

As Claude Code Hook:
  Configure this script as a post-output hook in your Claude Code settings.
    `);
  } else {
    // When running as hook, no debug output - only JSON for Claude Code
    processInput();
  }
}
