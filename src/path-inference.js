const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

function generateProjectIdentifier(cwd) {
  // Convert absolute path to Claude project identifier
  // Example: /home/rowanm/code/project -> -home-rowanm-code-project
  return '-' + cwd.replace(/\//g, '-').replace(/^-/, '');
}

function inferClaudeJsonlPath(cwd = process.cwd(), homeDir = os.homedir(), mockFs = fs) {
  try {
    // Generate the project identifier from current working directory
    const projectId = generateProjectIdentifier(cwd);
    
    // Construct the Claude projects directory path
    const claudeProjectDir = path.join(homeDir, '.claude', 'projects', projectId);
    
    // Check if the Claude project directory exists
    if (!mockFs.existsSync(claudeProjectDir)) {
      return null;
    }
    
    // Read directory contents and filter for JSONL files
    const files = mockFs.readdirSync(claudeProjectDir);
    const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
    
    if (jsonlFiles.length === 0) {
      return null;
    }
    
    // If multiple JSONL files exist, return the most recent one
    if (jsonlFiles.length === 1) {
      return path.join(claudeProjectDir, jsonlFiles[0]);
    }
    
    // Sort by modification time (most recent first)
    const sortedFiles = jsonlFiles
      .map(file => ({
        name: file,
        path: path.join(claudeProjectDir, file),
        mtime: mockFs.statSync(path.join(claudeProjectDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    return sortedFiles[0].path;
    
  } catch (error) {
    // Return null on any error (permission issues, etc.)
    return null;
  }
}

module.exports = {
  inferClaudeJsonlPath,
  generateProjectIdentifier
};