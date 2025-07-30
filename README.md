# Commitify - AI-Powered Commit Messages

A VS Code extension that generates intelligent commit messages using Ollama AI, directly integrated into your source control workflow.

## Features

- 🤖 **AI-Powered**: Generate conventional commit messages using local Ollama models
- ⚡ **Seamless Integration**: Adds buttons directly to VS Code's Source Control tab
- 🎯 **Smart Two-Stage Analysis**: Processes files individually, then combines summaries for better context
- 📁 **Individual File Processing**: Analyzes each changed file separately for comprehensive understanding
- 🔧 **Auto-Installation Detection**: Detects Ollama installation and offers guided setup
- 📦 **Model Management**: Automatically pull and manage Ollama models
- ⚙️ **Highly Configurable**: Customize models, context windows, and generation parameters
- 🔒 **Privacy-First**: Uses local Ollama instance - no data sent to external services
- 📝 **Conventional Commits**: Follows conventional commit format (feat, fix, docs, etc.)

## Requirements

- [Ollama](https://ollama.ai/) (automatically detected and guided installation if missing)
- VS Code 1.74.0 or higher
- Git repository

## Installation

### From VSIX Package (Recommended for Users)
1. Ensure you have `vsce` installed globally: `npm install -g @vscode/vsce`
2. Navigate to the extension's root directory in your terminal.
3. Package the extension: `vsce package`
4. This will generate a `.vsix` file (e.g., `commitify-0.0.1.vsix`).
5. In VS Code, go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
6. Click on the `...` (More Actions) menu at the top right of the Extensions sidebar.
7. Select "Install from VSIX..." and choose the `.vsix` file you just created.
8. Reload VS Code when prompted.

### From Source (For Developers)
1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press F5 to open a new Extension Development Host window

## Quick Start

1. **Open Commitify Settings**: Click the ⚙️ button in the Source Control tab
2. **Install Ollama** (if needed): Follow the download links provided in settings
3. **Pull Recommended Model**: Click "Pull Recommended Model" to get qwen3:4b
4. **Stage your changes**: Use `git add` or VS Code's Source Control view
5. **Generate commit message**: Click the ✨ button in the Source Control tab
6. **Review and commit**: The generated message will appear in the commit input box

## How It Works

### Two-Stage Processing (Recommended)
1. **File Analysis**: Each changed file is analyzed individually
2. **Summary Generation**: AI creates concise summaries for each file's changes
3. **Message Synthesis**: Final commit message is generated from all file summaries
4. **Result**: More accurate and contextual commit messages

### Legacy Single-Stage (Optional)
- Analyzes all changes as a single diff (can be enabled in settings)

## Configuration

### Settings Panel
Access via the **⚙️ Settings** button in the Source Control tab:

#### Ollama Status
- **Installation Detection**: Automatic detection with download links
- **Service Management**: Start/stop Ollama service
- **Connection Testing**: Verify Ollama connectivity

#### Model Management
- **Recommended Model**: qwen3:4b (optimized for code analysis)
- **Model Pulling**: Automatic model download with progress tracking
- **Available Models**: View and select from installed models

#### Message Configuration
- **Subject Line Length**: Maximum characters (default: 72)
- **Include Body Text**: Toggle detailed explanations
- **Individual Processing**: Enable/disable file-by-file analysis

#### Advanced Settings
- **Context Window**: Token limit (default: 8K)
- **Temperature**: Creativity level (0.0-1.0, default: 0.7)
- **Custom Prompts**: Override default prompt templates

## Supported Models

| Model | Size | Best For | Speed |
|-------|------|----------|-------|
| **qwen3:4b** ⭐ | ~2.3GB | Code analysis (recommended) | Fast |
| **qwen3:1.7b** | ~1.0GB | Code analysis (faster alternative) | Very Fast |
| deepseek-r1:8b | ~4.7GB | Code-specific tasks | Medium |
| deepseek-r1:7b | ~4.1GB | Code-specific tasks | Medium |
| deepseek-r1:1.5b | ~0.9GB | Code-specific tasks (lightweight) | Very Fast |
| gemma3:4b | ~2.5GB | General purpose | Fast |
| gemma3:1b | ~0.6GB | General purpose (lightweight) | Very Fast |
| mistral | ~4.1GB | Efficient alternative | Medium |

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `commitify.ollamaUrl` | `http://localhost:11434` | Ollama server URL |
| `commitify.model` | `qwen3:4b` | Model to use for generation |
| `commitify.maxLength` | `72` | Maximum subject line length |
| `commitify.includeBody` | `true` | Include detailed body text |
| `commitify.processFilesIndividually` | `true` | Process files separately |
| `commitify.contextWindow` | `8192` | Token context window size |
| `commitify.temperature` | `0.7` | Generation creativity level |
| `commitify.commitPromptTemplate` | `""` | Custom prompt template for commit message generation. Use `{summaries}`, `{maxLength}`, `{includeBody}` as placeholders. |
| `commitify.summaryPromptTemplate` | `""` | Custom prompt template for file change summarization. Use `{filename}`, `{diff}` as placeholders. |

## Example Output

### Individual File Processing
**Changed Files:**
- `src/auth.ts` (modified): Added JWT validation
- `src/login.tsx` (modified): Updated login form
- `README.md` (modified): Added installation instructions

**Generated Commit:**
```
feat(auth): implement JWT validation and update login UI

- Add JWT token validation with expiration checking in auth service
- Update login form component with better error handling
- Add comprehensive installation instructions to README
```

### Conventional Commit Examples

**Bug Fix:**
```
fix(api): resolve user authentication timeout

- Increase token refresh interval from 5min to 15min
- Add retry logic for failed authentication requests
- Update error messages for better user guidance
```

**New Feature:**
```
feat(ui): add dark mode support

- Implement theme switcher component with toggle animation
- Add dark/light theme CSS variables
- Persist theme preference in localStorage
```

**Documentation:**
```
docs: update API reference and examples

- Add new endpoint documentation for v2.0
- Include request/response examples
- Fix typos in configuration section
```

## Troubleshooting

### Installation Issues

**"Ollama Not Found"**
- Use the settings panel to download Ollama for your OS
- Restart VS Code after installation
- Click "Check Ollama Status" to verify

**"Failed to Pull Model"**
- Ensure Ollama is running (`ollama serve`)
- Check internet connection
- Try pulling manually: `ollama pull qwen3:4b`

### Generation Issues

**"No Staged Changes"**
- Stage files using `git add` or VS Code Source Control
- Ensure you're in a git repository
- Check that files have actual changes

**"Connection Failed"**
- Verify Ollama URL in settings (default: `http://localhost:11434`)
- Check if Ollama service is running
- Test connection using the settings panel

**"Poor Quality Messages"**
- Try the recommended qwen3:4b model
- Enable individual file processing
- Adjust temperature for more/less creativity
- Check that changes are meaningful and well-structured

### Performance Tips

- **Use qwen3:4b**: Optimized balance of speed and quality
- **Enable File Processing**: Individual analysis provides better context
- **Limit Staged Changes**: Process related changes together
- **Adjust Context Window**: Increase for complex changes, decrease for speed

## Development

### Building from Source
```bash
git clone <repository-url>
cd commitify
npm install
npm run compile
```

### Architecture
```
src/
├── extension.ts    # Main extension logic and command handlers
├── ollama.ts      # Ollama service with installation detection
├── git.ts         # Git operations and file processing
└── settings.ts    # Settings webview provider

media/
└── settings.html  # Settings UI (separate from TypeScript)
```

### Key Features Implementation
- **Two-stage processing**: File summaries → final message
- **Installation detection**: Automatic Ollama setup guidance
- **Model management**: Pull and list models programmatically
- **Progress tracking**: Real-time feedback during generation
- **Error handling**: Comprehensive error messages and recovery

## Privacy & Security

- **100% Local**: All processing happens on your machine
- **No Telemetry**: Zero data collection or tracking
- **Open Source**: Full source code available for inspection
- **Offline Capable**: Works without internet (after model download)
- **No External APIs**: Never sends code to external services

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Issues**: Report bugs and request features
- 💬 **Discussions**: Community support and ideas
- 📖 **Wiki**: Detailed documentation and guides

## Changelog

### v0.0.1
- Initial release with qwen3:4b model support
- Two-stage commit message generation
- Automatic Ollama installation detection
- Model management with automatic pulling
- Individual file processing for better analysis
- Comprehensive settings UI with real-time testing
- 8K token context window support
- Source Control integration with progress indicators

---

**Made with ❤️ for developers who value meaningful commit messages**