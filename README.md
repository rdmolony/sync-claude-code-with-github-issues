# Sync Claude Code with GitHub Issues

If you're using Large Language Models (LLMs) to generate code, you might want to link your code commits to your conversations so your colleagues (or your future self) can understand the code's conversational context.

To do so, this repository includes a file called `CLAUDE.md` which provides instructions to [`Claude Code`](https://github.com/anthropics/claude-code) which kindly ask it to ...

- 🎯 **Goal Track**: Each conversation goal gets its own GitHub issue
- 📝 **Log Conversations to Issues**: All prompts and responses are logged with timestamps to the Goal's GitHub issue
- 🚀 **Smart Commits**: Generate `Git` commits & link them to their corresponding GitHub issues

The instructions teach [`Claude Code`](https://github.com/anthropics/claude-code) how to use the [`GitHub CLI`](https://github.com/cli/cli) & [`Git`](https://git-scm.com/downloads) to to do so.

>[!NOTE]
> The idea of linking code to its conversation isn't novel -
> - Simon Willison has been linking his conversations to his LLM-generated code for some time now at [`simonw/tools`](https://github.com/simonw/tools), however, from what I can see (on 20th June 2025) he uses links to his web chats hosted by LLM providers.

>[!WARNING]
> This tool is both experimental & [non-deterministic](https://en.wikipedia.org/wiki/Nondeterministic_programming). It merely asks an LLM to follow instructions, and makes no guarantees that the LLM will do so! However, that doesn't mean it's not useful.

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

## Example Workflow

```bash
$ claude
# Claude asks: "Would you like me to log this session to GitHub?"
# You say: "yes"
# Claude creates issue and starts logging

# Your conversation gets tracked automatically
# When done, Claude suggests: "Commit: feat: add user authentication"
# You approve, and changes are committed with "Closes #123"
```

## File Structure

```
your-project/
├── CLAUDE.md          # Instructions for Claude Code
├── logs/              # Timestamped conversation logs synced with GitHub
│   ├── 2025-06-20-143526.md
│   └── 2025-06-20-145453.md
└── README.md          # This file
```

## Troubleshooting

- **Authentication issues**: Run `gh auth status` to check GitHub CLI authentication
- **Permission errors**: Ensure you have write access to the repository
- **Missing logs directory**: Create it with `mkdir logs`
