const { test, describe } = require('node:test');
const assert = require('node:assert');
const { convertToMarkdown } = require('../src/markdown');

describe('Markdown Converter', () => {
  test('convertToMarkdown should handle simple user message', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello, how are you?"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    assert(result.includes('# Conversation Log'));
    assert(result.includes('**(user)**'));
    assert(result.includes('Hello, how are you?'));
  });

  test('convertToMarkdown should handle assistant message', () => {
    const lines = [
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "I\'m doing well, thank you!"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    assert(result.includes('**(llm)**'));
    assert(result.includes('I\'m doing well, thank you!'));
  });

  test('convertToMarkdown should handle multiple messages', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hi there!"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    assert(result.includes('**(user)**'));
    assert(result.includes('Hello'));
    assert(result.includes('**(llm)**'));
    assert(result.includes('Hi there!'));
  });

  test('convertToMarkdown should handle tool use messages', () => {
    const lines = [
      '{"message": {"role": "assistant", "content": [{"type": "tool_use", "name": "bash", "input": {"command": "ls -la"}}]}, "timestamp": "2023-01-01T12:02:00.000Z"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    assert(result.includes('**(llm)**'));
    assert(result.includes('<details>'));
    assert(result.includes('<summary>🔧 Tool Use: bash</summary>'));
    assert(result.includes('```json'));
    assert(result.includes('"command": "ls -la"'));
    assert(result.includes('</details>'));
  });

  test('convertToMarkdown should skip invalid lines', () => {
    const lines = [
      'invalid json',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Valid message"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"not": "a message"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    assert(result.includes('Valid message'));
    assert(!result.includes('invalid json'));
    assert(!result.includes('not'));
  });

  test('convertToMarkdown should handle empty input', () => {
    const result = convertToMarkdown([]);
    
    assert(result.includes('# Conversation Log'));
    assert(result.includes('*No messages found*'));
  });

  test('convertToMarkdown should handle mixed content types', () => {
    const lines = [
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Here\'s the result:"}, {"type": "tool_use", "name": "read", "input": {"file": "test.txt"}}]}, "timestamp": "2023-01-01T12:03:00.000Z"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    assert(result.includes('**(llm)**'));
    assert(result.includes('Here\'s the result:'));
    assert(result.includes('<details>'));
    assert(result.includes('<summary>🔧 Tool Use: read</summary>'));
    assert(result.includes('"file": "test.txt"'));
    assert(result.includes('</details>'));
  });

  test('convertToMarkdown should skip empty messages', () => {
    const lines = [
      '{"message": {"role": "user", "content": []}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": ""}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Valid message"}]}, "timestamp": "2023-01-01T12:02:00.000Z"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    // Should only include the valid message
    const userSections = result.split('**(user)**').length - 1;
    assert.strictEqual(userSections, 1);
    assert(result.includes('Valid message'));
  });

  test('convertToMarkdown should skip tool result messages', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "tool_result", "content": "command output"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Actual user message"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}'
    ];
    
    const result = convertToMarkdown(lines);
    
    // Should only include the actual user message, not tool results
    const userSections = result.split('**(user)**').length - 1;
    assert.strictEqual(userSections, 1);
    assert(result.includes('Actual user message'));
    assert(!result.includes('command output'));
  });
});