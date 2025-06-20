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

### New Goal Detection
When a user prompt represents a new goal (distinct from the current tracked issue):
1. Recognize the new goal and infer an appropriate GitHub issue title
2. Ask the user if they want to create a new issue for this goal
3. If yes, create a new GitHub issue and switch tracking to the new issue number
4. Examples of new goals: "let's prove that...", "now implement...", "create a new feature for...", "fix the bug in..."

### Conversation Logging
1. Before answering any user prompt, first save the previous prompt and your responses to a markdown file in folder `logs` named with the current timestamp (format: `YYYY-MM-DD-HHMMSS.md`)
2. Log the conversation in this format (detect actual GitHub username using `gh api user --jq .login`):
   ```markdown
   (@username) User's prompt/question
   
   (claude) Your complete response including tool usage and output
   ```
3. Create a GitHub issue comment from the log file using `gh issue comment <issue-number> --body-file <timestamp-file.md>`
4. Then proceed to answer the current user prompt

### Goal Completion Workflow
When a goal has been completed:
1. Suggest a commit title and message to the user
2. Include a line in the commit message to link to the relevant issue: "Closes #<issue-number>"
3. If the user accepts the proposed commit:
   - Stage files with `git add`
   - Commit with the approved message
   - Push to GitHub using `git push origin "$(git branch --show-current)"`

### Commands
- `gh issue create --title "Goal Title" --body ""` - Create tracking issue
- `date +"%Y-%m-%d-%H%M%S"` - Generate timestamp for log files
- `gh api user --jq .login` - Get current GitHub username
- `gh issue comment <issue-number> --body-file <timestamp-file.md>` - Add conversation log as issue comment
- `git add` - Stage files for commit
- `git commit -m "message"` - Commit with message
- `git push origin "$(git branch --show-current)"` - Push to current branch