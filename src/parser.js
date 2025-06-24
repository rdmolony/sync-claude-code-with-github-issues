function parseJsonlLine(line) {
  if (!line || !line.trim()) {
    return null;
  }
  
  try {
    return JSON.parse(line.trim());
  } catch (error) {
    return null;
  }
}

function extractMessage(messageObj) {
  if (!messageObj || messageObj.type !== 'message') {
    return null;
  }
  
  if (typeof messageObj.content === 'string') {
    return messageObj.content;
  }
  
  if (messageObj.content && typeof messageObj.content === 'object' && messageObj.content.text) {
    return messageObj.content.text;
  }
  
  return null;
}

// Extract message from Claude's complex JSONL format
function extractClaudeMessage(messageObj) {
  // Handle Claude's assistant messages
  if (messageObj.message && messageObj.message.role === 'assistant' && messageObj.message.content) {
    const content = messageObj.message.content;
    if (Array.isArray(content)) {
      // Find text content in the array
      const textContent = content.find(item => item.type === 'text');
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }
  }
  
  // Handle Claude's user messages  
  if (messageObj.message && messageObj.message.role === 'user' && messageObj.message.content) {
    if (typeof messageObj.message.content === 'string') {
      return messageObj.message.content;
    }
    if (Array.isArray(messageObj.message.content)) {
      const textContent = messageObj.message.content.find(item => item.type === 'text');
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }
  }
  
  // Fallback to original parser
  return extractMessage(messageObj);
}

function getMessageRole(messageObj) {
  if (messageObj.message && messageObj.message.role) {
    return messageObj.message.role;
  }
  if (messageObj.type) {
    return messageObj.type;
  }
  return 'unknown';
}

function processNewLines(lines) {
  if (!lines || lines.length === 0) {
    return;
  }

  for (const line of lines) {
    const messageObj = parseJsonlLine(line);
    if (messageObj) {
      const message = extractClaudeMessage(messageObj);
      if (message) {
        const role = getMessageRole(messageObj);
        const timestamp = messageObj.timestamp || new Date().toISOString();
        
        console.log(`[${timestamp}] ${role.toUpperCase()}: ${message}`);
      }
    }
  }
}

module.exports = {
  parseJsonlLine,
  extractMessage,
  extractClaudeMessage,
  getMessageRole,
  processNewLines
};