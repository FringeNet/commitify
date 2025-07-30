import * as vscode from 'vscode';
import axios from 'axios';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class OllamaService {
    private getConfig() {
        return vscode.workspace.getConfiguration('commitify');
    }

    async generateCommitMessage(fileSummaries: string[]): Promise<string> {
        const config = this.getConfig();
        const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
        const model = config.get<string>('model', 'qwen3:4b');
        const maxLength = config.get<number>('maxLength', 72);
        const includeBody = config.get<boolean>('includeBody', true);
        const contextWindow = config.get<number>('contextWindow', 8192);
        const temperature = config.get<number>('temperature', 0.7);
        const commitPromptTemplate = config.get<string>('commitPromptTemplate', '');

        const prompt = commitPromptTemplate ?
            this.buildCustomCommitPrompt(commitPromptTemplate, fileSummaries, maxLength, includeBody) :
            this.buildFinalCommitPrompt(fileSummaries, maxLength, includeBody);

        try {
            const response = await axios.post(`${ollamaUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: temperature,
                    top_p: 0.9,
                    num_ctx: contextWindow
                }
            }, {
                timeout: 120000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.response) {
                const cleanedResponse = this.stripReasoningBlocks(response.data.response);
                return this.cleanCommitMessage(cleanedResponse, maxLength);
            } else {
                throw new Error('Invalid response from Ollama');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Cannot connect to Ollama. Make sure Ollama is running and accessible at ' + ollamaUrl);
                } else if (error.response?.status === 404) {
                    throw new Error(`Model '${model}' not found. Please install it with: ollama pull ${model}`);
                } else {
                    throw new Error(`Ollama request failed: ${error.message}`);
                }
            }
            throw error;
        }
    }

    async summarizeFileChanges(filename: string, diff: string): Promise<string> {
        const config = this.getConfig();
        const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
        const model = config.get<string>('model', 'qwen3:4b');
        const contextWindow = config.get<number>('contextWindow', 8192);
        const temperature = config.get<number>('temperature', 0.7);
        const summaryPromptTemplate = config.get<string>('summaryPromptTemplate', '');

        const prompt = summaryPromptTemplate ?
            this.buildCustomSummaryPrompt(summaryPromptTemplate, filename, diff) :
            this.buildFileSummaryPrompt(filename, diff);

        try {
            const response = await axios.post(`${ollamaUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: temperature,
                    top_p: 0.9,
                    num_ctx: contextWindow
                }
            }, {
                timeout: 120000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.response) {
                const cleanedResponse = this.stripReasoningBlocks(response.data.response);
                return cleanedResponse.trim();
            } else {
                throw new Error('Invalid response from Ollama');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Cannot connect to Ollama. Make sure Ollama is running and accessible at ' + ollamaUrl);
                } else if (error.response?.status === 404) {
                    throw new Error(`Model '${model}' not found. Please install it with: ollama pull ${model}`);
                } else {
                    throw new Error(`Ollama request failed: ${error.message}`);
                }
            }
            throw error;
        }
    }

    private buildFileSummaryPrompt(filename: string, diff: string): string {
        return `Analyze the changes in this file and provide a concise summary:

File: ${filename}

Diff:
${diff}

Provide a brief summary (1-2 sentences) of what changed in this file:`;
    }

    private buildCustomSummaryPrompt(template: string, filename: string, diff: string): string {
        return template
            .replace(/\{filename\}/g, filename)
            .replace(/\{diff\}/g, diff);
    }

    private buildFinalCommitPrompt(fileSummaries: string[], maxLength: number, includeBody: boolean): string {
        const bodyInstruction = includeBody
            ? 'Include a detailed body explaining what was changed and why.'
            : 'Only provide the subject line.';

        const summariesText = fileSummaries.map((summary, index) => `${index + 1}. ${summary}`).join('\n');

        return `You are an expert software developer. Based on the following file change summaries, generate a conventional commit message.

Rules:
- Subject line must be ${maxLength} characters or less
- Use conventional commit format: type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore, build, ci
- Be concise but descriptive
- Use imperative mood (e.g., "add" not "added")
- Output only the commit message, no character count, or anything else.
- ${bodyInstruction}

File change summaries:
${summariesText}

Generate a commit message:`;
    }

    private buildCustomCommitPrompt(template: string, fileSummaries: string[], maxLength: number, includeBody: boolean): string {
        const summariesText = fileSummaries.map((summary, index) => `${index + 1}. ${summary}`).join('\n');
        const bodyInstruction = includeBody ? 'true' : 'false';
        
        return template
            .replace(/\{summaries\}/g, summariesText)
            .replace(/\{maxLength\}/g, maxLength.toString())
            .replace(/\{includeBody\}/g, bodyInstruction);
    }

    private stripReasoningBlocks(message: string): string {
        // Remove <think>...</think> blocks and any whitespace after them
        // This handles reasoning models that output their thought process
        return message.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();
    }

    private cleanCommitMessage(message: string, maxLength: number): string {
        // Remove any markdown formatting
        message = message.replace(/```[\s\S]*?```/g, '');
        message = message.replace(/`([^`]*)`/g, '$1');
        
        // Remove common prefixes that might be added by the AI
        message = message.replace(/^(Commit message:|Here's a commit message:|Generated commit message:)\s*/i, '');
        
        // Return the cleaned message without artificial truncation
        return message.trim() || 'chore: update files';
    }

    async testConnection(): Promise<boolean> {
        const config = this.getConfig();
        const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');

        try {
            const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async getAvailableModels(): Promise<Array<{name: string, size?: string}>> {
        const config = this.getConfig();
        const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');

        try {
            const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 5000 });
            if (response.data && response.data.models) {
                return response.data.models.map((model: any) => ({
                    name: model.name,
                    size: model.size ? this.formatBytes(model.size) : undefined
                }));
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    async checkInstallation(): Promise<{installed: boolean, running: boolean, error?: string}> {
        try {
            // First check if Ollama command exists
            try {
                await execAsync('ollama --version');
            } catch (error) {
                return { installed: false, running: false, error: 'Ollama command not found' };
            }

            // Check if Ollama service is running
            const isRunning = await this.testConnection();
            return { installed: true, running: isRunning };
        } catch (error) {
            return {
                installed: false,
                running: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async startService(): Promise<void> {
        try {
            // Try to start Ollama service
            await execAsync('ollama serve', { timeout: 5000 });
        } catch (error) {
            // Service might already be running or started in background
            // Check if it's actually running now
            const isRunning = await this.testConnection();
            if (!isRunning) {
                throw new Error('Failed to start Ollama service');
            }
        }
    }

    async pullModel(modelName: string, progressCallback?: (progress: {percent: number, status: string}) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const process = spawn('ollama', ['pull', modelName]);
            
            let hasError = false;
            
            process.stdout.on('data', (data: any) => {
                const output = data.toString();
                // Parse ollama pull output for progress
                const progressMatch = output.match(/(\d+)%/);
                if (progressMatch && progressCallback) {
                    const percent = parseInt(progressMatch[1]);
                    progressCallback({ percent, status: `Pulling ${modelName}... ${percent}%` });
                }
            });

            process.stderr.on('data', (data: any) => {
                const error = data.toString();
                if (error.includes('error') || error.includes('failed')) {
                    hasError = true;
                    reject(new Error(error));
                }
            });

            process.on('close', (code: any) => {
                if (code === 0 && !hasError) {
                    if (progressCallback) {
                        progressCallback({ percent: 100, status: `Successfully pulled ${modelName}` });
                    }
                    resolve();
                } else if (!hasError) {
                    reject(new Error(`Failed to pull model ${modelName}`));
                }
            });

            process.on('error', (error: any) => {
                reject(new Error(`Failed to execute ollama pull: ${error.message}`));
            });
        });
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}