const { parseJsonlLine, extractClaudeMessage, getMessageRole } = require('./parser');

function convertToMarkdown(lines) {
  let markdown = '# Conversation Log\n\n';
  
  if (!lines || lines.length === 0) {
    markdown += '*No messages found*\n';
    return markdown;
  }

  let hasValidMessages = false;

  for (const line of lines) {
    const messageObj = parseJsonlLine(line);
    if (!messageObj || !messageObj.message) {
      continue; // Skip invalid lines
    }

    const role = getMessageRole(messageObj);
    const timestamp = messageObj.timestamp || new Date().toISOString();
    const content = messageObj.message.content;

    // Check if message has meaningful content
    let hasContent = false;
    let contentToRender = [];
    
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.type === 'text' && item.text && item.text.trim()) {
          hasContent = true;
          contentToRender.push({type: 'text', text: item.text});
        } else if (item.type === 'tool_use') {
          hasContent = true;
          contentToRender.push({type: 'tool_use', name: item.name, input: item.input});
        }
        // Skip tool_result type - these are internal tool outputs
      }
    } else if (typeof content === 'string' && content.trim()) {
      hasContent = true;
      contentToRender.push({type: 'text', text: content});
    }

    // Skip messages with no meaningful content
    if (!hasContent) {
      continue;
    }

    // Map role to new format
    const displayRole = role === 'assistant' ? 'llm' : role;
    
    markdown += `**(${displayRole})**\n\n`;
    
    // Render the content
    for (const item of contentToRender) {
      if (item.type === 'text') {
        markdown += `${item.text}\n\n`;
        hasValidMessages = true;
      } else if (item.type === 'tool_use') {
        markdown += `**Tool Use:** ${item.name}\n\n`;
        markdown += '```json\n';
        markdown += JSON.stringify(item.input, null, 2);
        markdown += '\n```\n\n';
        hasValidMessages = true;
      }
    }
  }

  if (!hasValidMessages) {
    markdown += '*No messages found*\n';
  }

  return markdown;
}

module.exports = {
  convertToMarkdown
};