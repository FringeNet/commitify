# Contributing to Commitify

Thank you for your interest in contributing to Commitify! We welcome contributions from the community and are pleased to have you aboard.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Issue Guidelines](#issue-guidelines)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive
- Exercise empathy and kindness
- Focus on what is best for the community
- Show courtesy and respect towards differing viewpoints
- Accept constructive criticism gracefully

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- [Ollama](https://ollama.ai/) (for testing)

### First Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/commitify.git
   cd commitify
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/commitify.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Compile the project**:
   ```bash
   npm run compile
   ```

## Development Setup

### Running the Extension

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. The extension will be available in the new VS Code window
4. Test your changes by staging files and clicking the generate button

### Project Structure

```
commitify/
├── src/                    # TypeScript source files
│   ├── extension.ts        # Main extension entry point
│   ├── ollama.ts          # Ollama service and API integration
│   ├── git.ts             # Git operations and file processing
│   └── settings.ts        # Settings webview provider
├── media/                  # Static assets
│   └── settings.html      # Settings UI
├── out/                   # Compiled JavaScript (generated)
├── .vscode/               # VS Code configuration
├── package.json           # Extension manifest and dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

### Key Components

- **Extension.ts**: Main activation logic and command registration
- **Ollama.ts**: Handles Ollama communication, model management, and installation detection
- **Git.ts**: Git operations, diff processing, and file analysis
- **Settings.ts**: Webview provider for the settings UI

## How to Contribute

### Types of Contributions

We welcome several types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📝 **Documentation improvements**
- 🧪 **Tests**
- 🎨 **UI/UX improvements**
- 🔧 **Code refactoring**
- 🌐 **Translations**

### Before You Start

1. **Check existing issues** to see if someone is already working on it
2. **Create an issue** for new features or major changes
3. **Discuss your approach** with maintainers before starting work
4. **Keep changes focused** - one pull request per feature/fix

## Pull Request Process

### Before Submitting

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run compile
   npm run test  # When tests are available
   ```

4. **Update documentation** if needed

5. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat(ollama): add support for custom models"
   ```

### Submitting Your PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/GIFs for UI changes
   - List of changes made

3. **Ensure all checks pass**:
   - Code compiles without errors
   - No TypeScript errors
   - Follows coding standards

### PR Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Address feedback** promptly
4. **Squash commits** if requested
5. **Merge** when approved

## Coding Standards

### TypeScript Guidelines

- Use **TypeScript strict mode**
- Provide **explicit types** for function parameters and returns
- Use **interfaces** for object shapes
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces

### Code Style

- **Indentation**: 4 spaces
- **Line length**: 100 characters max
- **Semicolons**: Required
- **Quotes**: Single quotes preferred
- **Trailing commas**: Use in multiline structures

### Example Code Style

```typescript
interface CommitConfig {
    model: string;
    maxLength: number;
    includeBody: boolean;
}

class OllamaService {
    private config: CommitConfig;

    constructor(config: CommitConfig) {
        this.config = config;
    }

    async generateMessage(summaries: string[]): Promise<string> {
        const prompt = this.buildPrompt(summaries);
        return await this.callOllama(prompt);
    }
}
```

### File Organization

- **One class per file** when possible
- **Export at bottom** of file
- **Import order**: External libraries, then internal modules
- **Group related functions** together

## Testing Guidelines

### Manual Testing

For now, we rely on manual testing. When testing your changes:

1. **Test with different models** (qwen3:4b, codellama, etc.)
2. **Test with various file types** (.ts, .js, .py, .md, etc.)
3. **Test edge cases**:
   - Large diffs
   - Binary files
   - No staged changes
   - Ollama not running
   - Network errors

### Test Scenarios

- **Fresh installation** without Ollama
- **Model pulling** and management
- **Settings persistence** across VS Code restarts
- **Error handling** for various failure modes
- **Performance** with large repositories

## Issue Guidelines

### Bug Reports

When reporting bugs, please include:

- **VS Code version**
- **Commitify version**
- **Operating system**
- **Ollama version** and model
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Error messages** or logs
- **Screenshots** if applicable

### Bug Report Template

```markdown
**Environment:**
- VS Code Version: 1.85.0
- Commitify Version: 0.0.1
- OS: Windows 11
- Ollama Version: 0.1.0
- Model: qwen3:4b

**Steps to Reproduce:**
1. Stage files with changes
2. Click generate button
3. ...

**Expected Behavior:**
Commit message should be generated

**Actual Behavior:**
Error message appears: "Cannot connect to Ollama"

**Logs/Screenshots:**
[Attach relevant logs or screenshots]
```

## Feature Requests

### Before Requesting

- **Search existing issues** for similar requests
- **Consider the scope** - is this useful for most users?
- **Think about implementation** - is it technically feasible?

### Feature Request Template

```markdown
**Feature Description:**
Brief description of the feature

**Use Case:**
Why would this feature be useful?

**Proposed Solution:**
How should this feature work?

**Alternatives Considered:**
Other approaches you've thought about

**Additional Context:**
Any other relevant information
```

## Common Development Tasks

### Adding a New Ollama Model

1. Update model list in `settings.html`
2. Add model-specific configuration in `ollama.ts`
3. Test with the new model
4. Update documentation

### Adding a New Configuration Setting

1. Add to `package.json` contributions
2. Update settings UI in `media/settings.html`
3. Handle in `settings.ts`
4. Use in relevant service classes
5. Document in README

### Improving Error Handling

1. Identify error scenarios
2. Add appropriate try-catch blocks
3. Provide user-friendly error messages
4. Consider recovery strategies
5. Test error paths

## Getting Help

### Where to Get Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Comments**: For understanding specific implementation details

### Communication Guidelines

- **Be specific** about your question or problem
- **Provide context** about what you're trying to achieve
- **Include relevant code** snippets when applicable
- **Be patient** - maintainers are volunteers

## Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page

## License

By contributing to Commitify, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Commitify! Your efforts help make AI-powered commit messages accessible to developers everywhere. 🚀