const { test, describe } = require('node:test');
const assert = require('node:assert');
const { convertToMarkdown, segmentConversation, generateSegmentFilenames } = require('../src/markdown');

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

describe('Conversation Segmentation', () => {
  test('segmentConversation should detect GOAL: messages and split conversation', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hi there!"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: I want to build a new feature"}]}, "timestamp": "2023-01-01T12:02:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Let me help with that"}]}, "timestamp": "2023-01-01T12:03:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: Now I want to test it"}]}, "timestamp": "2023-01-01T12:04:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Sure, let\'s test"}]}, "timestamp": "2023-01-01T12:05:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    assert.strictEqual(segments.length, 3);
    assert.strictEqual(segments[0].length, 2); // Hello + Hi there
    assert.strictEqual(segments[1].length, 2); // GOAL + response
    assert.strictEqual(segments[2].length, 2); // GOAL + response
  });

  test('segmentConversation should return single segment when no GOAL: found', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hi there!"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    assert.strictEqual(segments.length, 1);
    assert.strictEqual(segments[0].length, 2);
  });

  test('segmentConversation should handle GOAL: at the beginning', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: Start with this task"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Let\'s start"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    assert.strictEqual(segments.length, 1);
    assert.strictEqual(segments[0].length, 2);
  });

  test('generateSegmentFilenames should create numbered filenames', () => {
    const baseFilename = '/path/to/output.md';
    const segmentCount = 3;
    
    const filenames = generateSegmentFilenames(baseFilename, segmentCount);
    
    assert.strictEqual(filenames.length, 3);
    assert.strictEqual(filenames[0], '/path/to/output-1.md');
    assert.strictEqual(filenames[1], '/path/to/output-2.md');
    assert.strictEqual(filenames[2], '/path/to/output-3.md');
  });

  test('generateSegmentFilenames should handle filename without extension', () => {
    const baseFilename = '/path/to/output';
    const segmentCount = 2;
    
    const filenames = generateSegmentFilenames(baseFilename, segmentCount);
    
    assert.strictEqual(filenames.length, 2);
    assert.strictEqual(filenames[0], '/path/to/output-1');
    assert.strictEqual(filenames[1], '/path/to/output-2');
  });

  test('segmentConversation should handle empty lines and invalid JSON', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '',  // empty line
      'invalid json',  // invalid JSON
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: New task"}]}, "timestamp": "2023-01-01T12:02:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Let me help"}]}, "timestamp": "2023-01-01T12:03:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    assert.strictEqual(segments.length, 2);
    assert.strictEqual(segments[0].length, 1); // Only valid message before GOAL
    assert.strictEqual(segments[1].length, 2); // GOAL + response
  });

  test('segmentConversation should handle GOAL: in non-text content', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "tool_use", "name": "bash", "input": {"command": "echo GOAL: not a real goal"}}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: This is a real goal"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Got it"}]}, "timestamp": "2023-01-01T12:02:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    assert.strictEqual(segments.length, 2);
    assert.strictEqual(segments[0].length, 1); // tool_use message (not treated as GOAL)
    assert.strictEqual(segments[1].length, 2); // Real GOAL + response
  });

  test('segmentConversation should handle consecutive GOAL messages', () => {
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: First task"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: Second task immediately"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "OK"}]}, "timestamp": "2023-01-01T12:02:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    assert.strictEqual(segments.length, 2);
    assert.strictEqual(segments[0].length, 1); // First GOAL
    assert.strictEqual(segments[1].length, 2); // Second GOAL + response
  });

  test('segmentConversation should handle string-based content format (legacy)', () => {
    const lines = [
      '{"message": {"role": "user", "content": "Hello world"}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hi there!"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "user", "content": "GOAL: This is a string-based GOAL"}, "timestamp": "2023-01-01T12:02:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Got it"}]}, "timestamp": "2023-01-01T12:03:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    assert.strictEqual(segments.length, 2);
    assert.strictEqual(segments[0].length, 2); // Hello + Hi there
    assert.strictEqual(segments[1].length, 2); // GOAL + response
  });

  test('REGRESSION: segmentConversation must create multiple segments for string-based GOAL content', () => {
    // This test prevents regression of the bug where string-based GOAL content
    // was not being detected, causing only one file to be created instead of multiple
    const lines = [
      '{"message": {"role": "user", "content": "Initial conversation"}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Response"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "user", "content": "GOAL: i want to delimit a jsonl conversation into multiple segments"}, "timestamp": "2023-01-01T12:02:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "I will help"}]}, "timestamp": "2023-01-01T12:03:00.000Z"}',
      '{"message": {"role": "user", "content": "GOAL: ill now try & prove this segmentation works using this string"}, "timestamp": "2023-01-01T12:04:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Perfect test"}]}, "timestamp": "2023-01-01T12:05:00.000Z"}'
    ];
    
    const segments = segmentConversation(lines);
    
    // CRITICAL: Must create exactly 3 segments, not 1 (which was the bug)
    assert.strictEqual(segments.length, 3, 'Must create multiple segments when GOAL delimiters are present');
    assert.strictEqual(segments[0].length, 2); // Initial conversation
    assert.strictEqual(segments[1].length, 2); // First GOAL + response
    assert.strictEqual(segments[2].length, 2); // Second GOAL + response
    
    // Verify each segment starts correctly
    const firstSegmentFirstMessage = JSON.parse(segments[0][0]);
    assert.strictEqual(firstSegmentFirstMessage.message.content, 'Initial conversation');
    
    const secondSegmentFirstMessage = JSON.parse(segments[1][0]);
    assert.strictEqual(secondSegmentFirstMessage.message.content, 'GOAL: i want to delimit a jsonl conversation into multiple segments');
    
    const thirdSegmentFirstMessage = JSON.parse(segments[2][0]);
    assert.strictEqual(thirdSegmentFirstMessage.message.content, 'GOAL: ill now try & prove this segmentation works using this string');
  });
});