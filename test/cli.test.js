const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('path');
const { main } = require('../cli');

describe('CLI Export Command', () => {
  const testDir = path.join(__dirname, 'temp');
  const testInput = path.join(testDir, 'test-input.jsonl');
  const testOutput = path.join(testDir, 'test-output.md');

  // Setup test directory and files
  function setupTestFiles() {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  }

  // Cleanup test files
  function cleanupTestFiles() {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }

  test('export command should create multiple files when GOAL: segments found', () => {
    setupTestFiles();
    
    // Create test JSONL with GOAL: segments
    const testContent = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hi there!"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: I want to build a feature"}]}, "timestamp": "2023-01-01T12:02:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Let me help"}]}, "timestamp": "2023-01-01T12:03:00.000Z"}',
      '{"message": {"role": "user", "content": [{"type": "text", "text": "GOAL: Now let\'s test it"}]}, "timestamp": "2023-01-01T12:04:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Sure!"}]}, "timestamp": "2023-01-01T12:05:00.000Z"}'
    ].join('\n');
    
    fs.writeFileSync(testInput, testContent);
    
    // Mock process.argv for export command
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'export', testInput, testOutput];
    
    try {
      main();
      
      // Check that multiple files were created
      assert(fs.existsSync(path.join(testDir, 'test-output-1.md')));
      assert(fs.existsSync(path.join(testDir, 'test-output-2.md')));
      assert(fs.existsSync(path.join(testDir, 'test-output-3.md')));
      
      // Original output file should not exist when segments are created
      assert(!fs.existsSync(testOutput));
      
    } finally {
      process.argv = originalArgv;
      cleanupTestFiles();
    }
  });

  test('export command should create single file when no GOAL: segments found', () => {
    setupTestFiles();
    
    // Create test JSONL without GOAL: segments
    const testContent = [
      '{"message": {"role": "user", "content": [{"type": "text", "text": "Hello"}]}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hi there!"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}'
    ].join('\n');
    
    fs.writeFileSync(testInput, testContent);
    
    // Mock process.argv for export command
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'export', testInput, testOutput];
    
    try {
      main();
      
      // Check that single file was created
      assert(fs.existsSync(testOutput));
      
      // No segmented files should exist
      assert(!fs.existsSync(path.join(testDir, 'test-output-1.md')));
      
    } finally {
      process.argv = originalArgv;
      cleanupTestFiles();
    }
  });

  test('export command should handle empty JSONL file', () => {
    setupTestFiles();
    
    fs.writeFileSync(testInput, '');
    
    // Mock process.argv for export command
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'export', testInput, testOutput];
    
    try {
      main();
      
      // Should create single file with no messages
      assert(fs.existsSync(testOutput));
      const content = fs.readFileSync(testOutput, 'utf8');
      assert(content.includes('*No messages found*'));
      
    } finally {
      process.argv = originalArgv;
      cleanupTestFiles();
    }
  });

  test('REGRESSION: export must create multiple files for string-based GOAL content', () => {
    // This test prevents regression of the bug where string-based GOAL content 
    // caused export to create only one file instead of multiple segmented files
    setupTestFiles();
    
    // Create test JSONL with string-based GOAL content (like the real fixture file)
    const testContent = [
      '{"message": {"role": "user", "content": "Initial conversation"}, "timestamp": "2023-01-01T12:00:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Response"}]}, "timestamp": "2023-01-01T12:01:00.000Z"}',
      '{"message": {"role": "user", "content": "GOAL: i want to delimit a jsonl conversation into multiple segments"}, "timestamp": "2023-01-01T12:02:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "I will help"}]}, "timestamp": "2023-01-01T12:03:00.000Z"}',
      '{"message": {"role": "user", "content": "GOAL: ill now try & prove this segmentation works using this string"}, "timestamp": "2023-01-01T12:04:00.000Z"}',
      '{"message": {"role": "assistant", "content": [{"type": "text", "text": "Perfect test"}]}, "timestamp": "2023-01-01T12:05:00.000Z"}'
    ].join('\n');
    
    fs.writeFileSync(testInput, testContent);
    
    // Mock process.argv for export command
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'export', testInput, testOutput];
    
    try {
      main();
      
      // CRITICAL: Must create multiple files, not just one (which was the bug)
      assert(fs.existsSync(path.join(testDir, 'test-output-1.md')), 'First segment file must exist');
      assert(fs.existsSync(path.join(testDir, 'test-output-2.md')), 'Second segment file must exist');
      assert(fs.existsSync(path.join(testDir, 'test-output-3.md')), 'Third segment file must exist');
      
      // Original output file should NOT exist when segments are created
      assert(!fs.existsSync(testOutput), 'Single output file should not exist when segments are created');
      
      // Verify content of each segment
      const segment1 = fs.readFileSync(path.join(testDir, 'test-output-1.md'), 'utf8');
      const segment2 = fs.readFileSync(path.join(testDir, 'test-output-2.md'), 'utf8');
      const segment3 = fs.readFileSync(path.join(testDir, 'test-output-3.md'), 'utf8');
      
      assert(segment1.includes('Initial conversation'), 'First segment should contain initial conversation');
      assert(segment2.includes('GOAL: i want to delimit'), 'Second segment should contain first GOAL');
      assert(segment3.includes('GOAL: ill now try & prove'), 'Third segment should contain second GOAL');
      
    } finally {
      process.argv = originalArgv;
      cleanupTestFiles();
    }
  });
});