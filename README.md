# Claude Conversation Tools

A CLI toolkit for working with Claude Code conversation logs. This project focuses on deterministic tools that process Claude's JSONL conversation files.

> [!WARNING]
> This tool is experimental, it's still a work in progress, see the Issues tab for the remaining items to bring this to completion.

## Features

- 📊 **Watch**: Real-time monitoring of Claude conversations as they happen
- 📄 **Export**: Convert JSONL conversation logs to clean, readable markdown
- 🔧 **Reliable**: Built with comprehensive test coverage using TDD principles

## Why This Matters

If you're using Large Language Models (LLMs) to generate code, you might want to link your code commits to your conversations so your colleagues (or your future self) can understand the code's conversational context.

>[!NOTE]
> The idea of linking code to its conversation isn't novel -
> - Simon Willison has been linking his conversations to his LLM-generated code for some time now at [`simonw/tools`](https://github.com/simonw/tools), however, from what I can see (on 20th June 2025) he uses links to his web chats hosted by LLM providers. Ever since reading Simon's blog post [The Perfect Commit](https://simonwillison.net/2022/Oct/29/the-perfect-commit/), I've found it really helpful for my future self to link commits to broader context on GitHub Issues by including issue numbers in my commit messages.
> - Simon Wardley has been talking about this style of conversational programming for years, I feel like this is in keeping with the spirit of [Why the Fuss About Conversational Programming?](https://blog.gardeviance.org/2023/01/why-fuss-about-conversational.html)

## Installation

You'll need three tools installed:

- [`Claude Code`](https://github.com/anthropics/claude-code)
- [`GitHub CLI`](https://github.com/cli/cli)
- [`Git`](https://git-scm.com/downloads)

>[!NOTE]
> If you're into [`Nix`](https://github.com/NixOS/nix), then you'll just need one tool.
> Run ...
> ```sh
> nix develop
> ```
> ... & `Nix` will install the required tools for you by reading `flake.nix`

Then:

1. **Use this repository as a template** or **Copy CLAUDE.md to your repository**
   Click `Use this template` & [follow the instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

3. **Start using Claude Code**:
   ```bash
   claude
   ```

Now `Claude Code` **should be** smart enough to log your conversations to GitHub Issues

## Usage

### Watch Mode - Real-time Monitoring

Monitor your Claude conversations as they happen:

```bash
./cli.js watch ~/.claude/projects/your-project/conversation-id.jsonl
```

This will show new messages in real-time as you chat with Claude.

### Export Mode - Generate Markdown

Convert conversation logs to clean, readable markdown:

```bash
./cli.js export input.jsonl output.md
```

The exported markdown includes:
- Clean conversation flow with `**(user)**` and `**(llm)**` labels
- Collapsible tool use sections with `<details>` tags  
- Proper formatting for sharing and documentation

## Project Structure

```
claude-conversation-tools/
├── cli.js             # Main CLI entry point
├── src/               # Source modules
│   ├── parser.js      # JSONL parsing and message extraction
│   ├── watcher.js     # File watching functionality  
│   └── markdown.js    # Markdown conversion
├── test/              # Test suites
│   ├── parser.test.js
│   ├── watcher.test.js
│   └── markdown.test.js
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Development

This project follows Test-Driven Development (TDD). To contribute:

1. **Write tests first** for new features
2. **Run tests** to ensure they fail: `npm test`
3. **Implement** the minimal code to make tests pass
4. **Refactor** while keeping tests green

See `CLAUDE.md` for detailed development guidelines.

## Troubleshooting

- **File not found**: Ensure the JSONL file path is correct
- **Permission errors**: Check file read permissions
- **Tests failing**: Run `npm test` to see specific error details
