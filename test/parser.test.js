const { test, describe } = require('node:test');
const assert = require('node:assert');
const { parseJsonlLine, extractMessage, processNewLines } = require('../src/parser');

describe('JSONL Parser', () => {
  test('parseJsonlLine should parse valid JSON line', () => {
    const line = '{"type": "message", "content": "Hello world", "timestamp": 1234567890}';
    const result = parseJsonlLine(line);
    
    assert.strictEqual(result.type, 'message');
    assert.strictEqual(result.content, 'Hello world');
    assert.strictEqual(result.timestamp, 1234567890);
  });

  test('parseJsonlLine should return null for invalid JSON', () => {
    const line = 'invalid json';
    const result = parseJsonlLine(line);
    
    assert.strictEqual(result, null);
  });

  test('parseJsonlLine should return null for empty line', () => {
    const line = '';
    const result = parseJsonlLine(line);
    
    assert.strictEqual(result, null);
  });

  test('extractMessage should extract content from message object', () => {
    const messageObj = {
      type: 'message',
      content: 'This is a test message',
      role: 'user',
      timestamp: 1234567890
    };
    
    const result = extractMessage(messageObj);
    assert.strictEqual(result, 'This is a test message');
  });

  test('extractMessage should return null for non-message objects', () => {
    const nonMessageObj = {
      type: 'system',
      data: 'system data'
    };
    
    const result = extractMessage(nonMessageObj);
    assert.strictEqual(result, null);
  });

  test('extractMessage should handle nested content structures', () => {
    const complexMessage = {
      type: 'message',
      content: {
        text: 'Nested content message'
      },
      role: 'assistant'
    };
    
    const result = extractMessage(complexMessage);
    assert.strictEqual(result, 'Nested content message');
  });

  test('processNewLines should handle valid JSONL lines', () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    const logOutput = [];
    console.log = (...args) => logOutput.push(args.join(' '));
    
    const lines = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello world"}]}, "timestamp": "2023-01-01T00:00:00.000Z"}'
    ];
    
    processNewLines(lines);
    
    // Restore console.log
    console.log = originalLog;
    
    // Verify message was processed
    assert(logOutput.some(output => output.includes('Hello world')));
    assert(logOutput.some(output => output.includes('USER')));
  });

  test('processNewLines should handle empty or null lines', () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    const logOutput = [];
    console.log = (...args) => logOutput.push(args.join(' '));
    
    processNewLines(null);
    processNewLines([]);
    processNewLines(['', '   ']);
    
    // Restore console.log
    console.log = originalLog;
    
    // Should not produce any output
    assert.strictEqual(logOutput.length, 0);
  });
});