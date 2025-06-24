const { test, describe, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

// Mock fs module for testing
const mockFs = mock.method(fs, 'watch');
const mockReadFileSync = mock.method(fs, 'readFileSync');
const mockExistsSync = mock.method(fs, 'existsSync');

describe('File Watcher', () => {
  test('watchFile should start watching the specified file', () => {
    // Reset mocks
    mockFs.mock.resetCalls();
    mockExistsSync.mock.resetCalls();
    
    // Mock file exists
    mockExistsSync.mock.mockImplementation(() => true);
    
    // Mock fs.watch to return a mock watcher
    const mockWatcher = {
      close: mock.fn()
    };
    mockFs.mock.mockImplementation(() => mockWatcher);
    
    const { watchFile } = require('../src/watcher');
    
    const testFile = '/test/file.jsonl';
    const callback = mock.fn();
    const result = watchFile(testFile, callback);
    
    // Verify fs.watch was called with correct file
    assert.strictEqual(mockFs.mock.callCount(), 1);
    assert.strictEqual(mockFs.mock.calls[0].arguments[0], testFile);
    
    // Verify return object structure
    assert(result.watcher);
    assert(typeof result.close === 'function');
    assert(typeof result.initialLineCount === 'number');
  });

  test('watchFile should throw error for non-existent file', () => {
    // Reset mocks
    mockExistsSync.mock.resetCalls();
    
    // Mock file doesn't exist
    mockExistsSync.mock.mockImplementation(() => false);
    
    const { watchFile } = require('../src/watcher');
    
    assert.throws(() => {
      watchFile('/nonexistent/file.jsonl', mock.fn());
    }, /File does not exist/);
  });

  test('watchFile should detect new lines and call callback', () => {
    // Reset mocks
    mockFs.mock.resetCalls();
    mockReadFileSync.mock.resetCalls();
    mockExistsSync.mock.resetCalls();
    
    // Mock file exists
    mockExistsSync.mock.mockImplementation(() => true);
    
    // Mock initial file content (empty)
    let fileContent = '';
    mockReadFileSync.mock.mockImplementation(() => fileContent);
    
    // Mock fs.watch to capture callback
    let changeCallback;
    mockFs.mock.mockImplementation((filePath, callback) => {
      changeCallback = callback;
      return {
        close: mock.fn()
      };
    });
    
    const { watchFile } = require('../src/watcher');
    
    // Mock callback to capture new lines
    const onNewLines = mock.fn();
    
    // Start watching
    watchFile('/test/file.jsonl', onNewLines);
    
    // Simulate file change with new JSONL line
    fileContent = '{"type": "message", "content": "Hello world", "role": "user"}\n';
    mockReadFileSync.mock.mockImplementation(() => fileContent);
    
    // Trigger change event
    changeCallback('change');
    
    // Verify callback was called with new lines
    assert.strictEqual(onNewLines.mock.callCount(), 1);
    assert.strictEqual(onNewLines.mock.calls[0].arguments[0].length, 1);
    assert(onNewLines.mock.calls[0].arguments[0][0].includes('Hello world'));
  });

  test('watchFile should handle multiple new lines', () => {
    // Reset mocks
    mockFs.mock.resetCalls();
    mockReadFileSync.mock.resetCalls();
    mockExistsSync.mock.resetCalls();
    
    // Mock file exists
    mockExistsSync.mock.mockImplementation(() => true);
    
    // Mock initial file content with one line
    let fileContent = '{"type": "message", "content": "First message", "role": "user"}\n';
    mockReadFileSync.mock.mockImplementation(() => fileContent);
    
    // Mock fs.watch to capture callback
    let changeCallback;
    mockFs.mock.mockImplementation((filePath, callback) => {
      changeCallback = callback;
      return {
        close: mock.fn()
      };
    });
    
    const { watchFile } = require('../src/watcher');
    
    // Mock callback to capture new lines
    const onNewLines = mock.fn();
    
    // Start watching (should track existing line)
    watchFile('/test/file.jsonl', onNewLines);
    
    // Simulate file change with additional lines
    fileContent = '{"type": "message", "content": "First message", "role": "user"}\n' +
                  '{"type": "message", "content": "Second message", "role": "assistant"}\n' +
                  '{"type": "message", "content": "Third message", "role": "user"}\n';
    mockReadFileSync.mock.mockImplementation(() => fileContent);
    
    // Trigger change event
    changeCallback('change');
    
    // Verify callback was called with only new lines (not the first one)
    assert.strictEqual(onNewLines.mock.callCount(), 1);
    const newLines = onNewLines.mock.calls[0].arguments[0];
    assert.strictEqual(newLines.length, 2);
    assert(newLines[0].includes('Second message'));
    assert(newLines[1].includes('Third message'));
  });
});