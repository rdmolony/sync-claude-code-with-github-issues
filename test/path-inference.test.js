const { test, describe } = require('node:test');
const assert = require('node:assert');
const { inferClaudeJsonlPath, generateProjectIdentifier } = require('../src/path-inference');

describe('Path Inference', () => {
  test('generateProjectIdentifier should convert absolute path to Claude project identifier', () => {
    const testCases = [
      {
        cwd: '/home/rowanm/code/sync-claude-code-with-github-issues',
        expected: '-home-rowanm-code-sync-claude-code-with-github-issues'
      },
      {
        cwd: '/home/rowanm/Documents/my-project',
        expected: '-home-rowanm-Documents-my-project'
      },
      {
        cwd: '/home/rowanm',
        expected: '-home-rowanm'
      }
    ];

    for (const { cwd, expected } of testCases) {
      const result = generateProjectIdentifier(cwd);
      assert.strictEqual(result, expected, `Failed for cwd: ${cwd}`);
    }
  });

  test('inferClaudeJsonlPath should find JSONL file in Claude projects directory', () => {
    const cwd = '/home/rowanm/code/sync-claude-code-with-github-issues';
    const homeDir = '/home/rowanm';
    
    // Mock file system to simulate Claude directory structure
    const mockFs = {
      existsSync: (path) => {
        if (path === '/home/rowanm/.claude/projects/-home-rowanm-code-sync-claude-code-with-github-issues') {
          return true;
        }
        return false;
      },
      readdirSync: (path) => {
        if (path === '/home/rowanm/.claude/projects/-home-rowanm-code-sync-claude-code-with-github-issues') {
          return ['c067f04b-74d2-4943-8dd5-c0540e4cae0e.jsonl', 'other-file.txt'];
        }
        return [];
      }
    };
    
    const result = inferClaudeJsonlPath(cwd, homeDir, mockFs);
    
    assert.strictEqual(
      result, 
      '/home/rowanm/.claude/projects/-home-rowanm-code-sync-claude-code-with-github-issues/c067f04b-74d2-4943-8dd5-c0540e4cae0e.jsonl'
    );
  });

  test('inferClaudeJsonlPath should return null when no Claude project directory exists', () => {
    const cwd = '/home/rowanm/nonexistent-project';
    const homeDir = '/home/rowanm';
    
    const mockFs = {
      existsSync: () => false,
      readdirSync: () => []
    };
    
    const result = inferClaudeJsonlPath(cwd, homeDir, mockFs);
    assert.strictEqual(result, null);
  });

  test('inferClaudeJsonlPath should return null when no JSONL files found', () => {
    const cwd = '/home/rowanm/code/sync-claude-code-with-github-issues';
    const homeDir = '/home/rowanm';
    
    const mockFs = {
      existsSync: () => true,
      readdirSync: () => ['other-file.txt', 'not-a-jsonl.md']
    };
    
    const result = inferClaudeJsonlPath(cwd, homeDir, mockFs);
    assert.strictEqual(result, null);
  });

  test('inferClaudeJsonlPath should return most recent JSONL when multiple exist', () => {
    const cwd = '/home/rowanm/code/sync-claude-code-with-github-issues';
    const homeDir = '/home/rowanm';
    
    const mockFs = {
      existsSync: () => true,
      readdirSync: () => ['old-session.jsonl', 'newer-session.jsonl'],
      statSync: (path) => {
        if (path.includes('newer-session.jsonl')) {
          return { mtime: new Date('2023-12-01') };
        }
        return { mtime: new Date('2023-11-01') };
      }
    };
    
    const result = inferClaudeJsonlPath(cwd, homeDir, mockFs);
    
    assert(result.endsWith('newer-session.jsonl'), 'Should return the most recent JSONL file');
  });

  test('inferClaudeJsonlPath should handle default parameters', () => {
    // This test will use real fs and os modules when no mocks provided
    const result = inferClaudeJsonlPath();
    
    // Should either return a valid path or null, but not throw an error
    assert(typeof result === 'string' || result === null);
  });
});