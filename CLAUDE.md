# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

This repository uses Nix flakes for development environment management with direnv integration. The development environment is automatically activated via direnv.

### Available Tools
- `gh` - GitHub CLI for repository operations
- `git` - Version control operations

## Conversation Tracking Workflow

### Session Initialization
1. At the start of each new session, ask the user if they wish to log this session to GitHub. Also, infer a GitHub issue title from the user's initial prompt and confirm the GitHub issue title with them. 
2. Create a GitHub issue using `gh issue create --title "<user's goal>" --body ""`
3. Note the issue number for reference throughout the session

### Conversation Logging
1. For each user interaction, create a temporary markdown file in folder `logs` named with the current timestamp (format: `YYYY-MM-DD-HHMMSS.md`)
2. Log the conversation in this format:
   ```markdown
   (@rdmolony) User's prompt/question
   
   (claude) Your complete response including tool usage and output
   ```
3. Continue appending to the same file throughout the interaction until the next user prompt
4. Save the user prompt and responses as a comment to the goal's GitHub issue thread using `gh issue comment <issue-number> --body-file <timestamp-file.md>`

### Commands
- `gh issue create --title "Goal Title" --body ""` - Create tracking issue
- `date +"%Y-%m-%d-%H%M%S"` - Generate timestamp for log files
- `gh issue comment <issue-number> --body-file <timestamp-file.md>` - Add conversation log as issue comment