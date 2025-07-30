import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SettingsProvider {
    private panel: vscode.WebviewPanel | undefined;

    constructor(private readonly extensionUri: vscode.Uri) {}

    public showSettings() {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (this.panel) {
            this.panel.reveal(columnToShowIn);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'commitifySettings',
            'Commitify Settings',
            columnToShowIn || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.command) {
                    case 'saveSettings':
                        await this.saveSettings(message.settings);
                        break;
                    case 'testConnection':
                        await this.testOllamaConnection();
                        break;
                    case 'getModels':
                        await this.getAvailableModels();
                        break;
                    case 'loadSettings':
                        await this.loadCurrentSettings();
                        break;
                    case 'checkOllamaInstallation':
                        await this.checkOllamaInstallation();
                        break;
                    case 'startOllama':
                        await this.startOllama();
                        break;
                    case 'pullModel':
                        await this.pullModel(message.model);
                        break;
                    case 'validateModel':
                        await this.validateModel(message.model);
                        break;
                }
            },
            undefined,
            []
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Load current settings when panel opens
        this.loadCurrentSettings();
    }

    private async saveSettings(settings: any) {
        const config = vscode.workspace.getConfiguration('commitify');
        
        try {
            await config.update('ollamaUrl', settings.ollamaUrl, vscode.ConfigurationTarget.Global);
            await config.update('model', settings.model, vscode.ConfigurationTarget.Global);
            await config.update('maxLength', settings.maxLength, vscode.ConfigurationTarget.Global);
            await config.update('includeBody', settings.includeBody, vscode.ConfigurationTarget.Global);
            await config.update('processFilesIndividually', settings.processFilesIndividually, vscode.ConfigurationTarget.Global);
            await config.update('contextWindow', settings.contextWindow, vscode.ConfigurationTarget.Global);
            await config.update('temperature', settings.temperature, vscode.ConfigurationTarget.Global);
            await config.update('commitPromptTemplate', settings.commitPromptTemplate, vscode.ConfigurationTarget.Global);
            await config.update('summaryPromptTemplate', settings.summaryPromptTemplate, vscode.ConfigurationTarget.Global);

            this.panel?.webview.postMessage({
                command: 'settingsSaved',
                success: true
            });

            vscode.window.showInformationMessage('Commitify settings saved successfully!');
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'settingsSaved',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async testOllamaConnection() {
        const { OllamaService } = await import('./ollama');
        const ollamaService = new OllamaService();
        
        try {
            const isConnected = await ollamaService.testConnection();
            this.panel?.webview.postMessage({
                command: 'connectionTest',
                success: isConnected,
                message: isConnected ? 'Connected to Ollama successfully!' : 'Failed to connect to Ollama'
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'connectionTest',
                success: false,
                message: error instanceof Error ? error.message : 'Connection test failed'
            });
        }
    }

    private async getAvailableModels() {
        const { OllamaService } = await import('./ollama');
        const ollamaService = new OllamaService();
        
        try {
            const models = await ollamaService.getAvailableModels();
            this.panel?.webview.postMessage({
                command: 'modelsLoaded',
                models: models
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'modelsLoaded',
                models: [],
                error: error instanceof Error ? error.message : 'Failed to load models'
            });
        }
    }

    private async loadCurrentSettings() {
        const config = vscode.workspace.getConfiguration('commitify');
        
        const settings = {
            ollamaUrl: config.get('ollamaUrl', 'http://localhost:11434'),
            model: config.get('model', 'qwen3:4b'),
            maxLength: config.get('maxLength', 72),
            includeBody: config.get('includeBody', true),
            processFilesIndividually: config.get('processFilesIndividually', true),
            contextWindow: config.get('contextWindow', 8192),
            temperature: config.get('temperature', 0.7),
            commitPromptTemplate: config.get('commitPromptTemplate', ''),
            summaryPromptTemplate: config.get('summaryPromptTemplate', '')
        };

        this.panel?.webview.postMessage({
            command: 'settingsLoaded',
            settings: settings
        });
    }

    private async checkOllamaInstallation() {
        const { OllamaService } = await import('./ollama');
        const ollamaService = new OllamaService();
        
        try {
            const status = await ollamaService.checkInstallation();
            this.panel?.webview.postMessage({
                command: 'ollamaStatus',
                installed: status.installed,
                running: status.running,
                error: status.error
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'ollamaStatus',
                installed: false,
                running: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async startOllama() {
        const { OllamaService } = await import('./ollama');
        const ollamaService = new OllamaService();
        
        try {
            await ollamaService.startService();
            this.panel?.webview.postMessage({
                command: 'ollamaStatus',
                installed: true,
                running: true
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'ollamaStatus',
                installed: true,
                running: false,
                error: error instanceof Error ? error.message : 'Failed to start Ollama'
            });
        }
    }

    private async pullModel(modelName: string) {
        const { OllamaService } = await import('./ollama');
        const ollamaService = new OllamaService();
        
        try {
            await ollamaService.pullModel(modelName, (progress) => {
                this.panel?.webview.postMessage({
                    command: 'modelPullProgress',
                    progress: progress.percent,
                    status: progress.status
                });
            });

            this.panel?.webview.postMessage({
                command: 'modelPullComplete',
                success: true
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'modelPullComplete',
                success: false,
                error: error instanceof Error ? error.message : 'Failed to pull model'
            });
        }
    }

    private async validateModel(modelName: string) {
        const { OllamaService } = await import('./ollama');
        const ollamaService = new OllamaService();
        
        try {
            // Check if model exists locally
            const models = await ollamaService.getAvailableModels();
            const modelExists = models.some(model => model.name === modelName);
            
            if (modelExists) {
                this.panel?.webview.postMessage({
                    command: 'modelValidation',
                    model: modelName,
                    status: 'exists',
                    message: `Model '${modelName}' is available locally`
                });
            } else {
                // Try to test if model is pullable by checking with Ollama
                try {
                    const testResponse = await ollamaService.testConnection();
                    if (testResponse) {
                        this.panel?.webview.postMessage({
                            command: 'modelValidation',
                            model: modelName,
                            status: 'pullable',
                            message: `Model '${modelName}' can be pulled from Ollama library`
                        });
                    } else {
                        this.panel?.webview.postMessage({
                            command: 'modelValidation',
                            model: modelName,
                            status: 'unavailable',
                            message: 'Cannot connect to Ollama server'
                        });
                    }
                } catch (error) {
                    this.panel?.webview.postMessage({
                        command: 'modelValidation',
                        model: modelName,
                        status: 'error',
                        message: `Error validating model: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                }
            }
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'modelValidation',
                model: modelName,
                status: 'error',
                message: `Error validating model: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private getWebviewContent(): string {
        const htmlPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'settings.html');
        try {
            const htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
            return htmlContent;
        } catch (error) {
            console.error('Failed to load settings HTML:', error);
            return '<html><body><h1>Error loading settings</h1><p>Could not load settings.html</p></body></html>';
        }
    }
}