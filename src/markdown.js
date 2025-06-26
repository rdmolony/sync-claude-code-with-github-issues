const { parseJsonlLine, extractClaudeMessage, getMessageRole } = require('./parser');
const path = require('path');

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
        markdown += `<details>\n<summary>🔧 Tool Use: ${item.name}</summary>\n\n`;
        markdown += '```json\n';
        markdown += JSON.stringify(item.input, null, 2);
        markdown += '\n```\n\n';
        markdown += '</details>\n\n';
        hasValidMessages = true;
      }
    }
  }

  if (!hasValidMessages) {
    markdown += '*No messages found*\n';
  }

  return markdown;
}

function segmentConversation(lines) {
  const segments = [];
  let currentSegment = [];
  
  for (const line of lines) {
    const messageObj = parseJsonlLine(line);
    if (!messageObj || !messageObj.message) {
      continue;
    }
    
    const role = getMessageRole(messageObj);
    const content = messageObj.message.content;
    
    // Check if this is a user message starting with "GOAL:"
    let isGoalMessage = false;
    if (role === 'user') {
      if (Array.isArray(content)) {
        // New format: content is an array of objects
        for (const item of content) {
          if (item.type === 'text' && item.text && item.text.trim().startsWith('GOAL:')) {
            isGoalMessage = true;
            break;
          }
        }
      } else if (typeof content === 'string' && content.trim().startsWith('GOAL:')) {
        // Legacy format: content is a string
        isGoalMessage = true;
      }
    }
    
    // If we found a GOAL message and we have content in current segment, start a new segment
    if (isGoalMessage && currentSegment.length > 0) {
      segments.push(currentSegment);
      currentSegment = [];
    }
    
    currentSegment.push(line);
  }
  
  // Add the last segment if it has content
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }
  
  // If no segments were created, return the entire conversation as one segment
  if (segments.length === 0) {
    return [lines];
  }
  
  return segments;
}

function generateSegmentFilenames(baseFilename, segmentCount) {
  const filenames = [];
  const parsedPath = path.parse(baseFilename);
  
  for (let i = 1; i <= segmentCount; i++) {
    const filename = path.join(
      parsedPath.dir,
      `${parsedPath.name}-${i}${parsedPath.ext}`
    );
    filenames.push(filename);
  }
  
  return filenames;
}

module.exports = {
  convertToMarkdown,
  segmentConversation,
  generateSegmentFilenames
};