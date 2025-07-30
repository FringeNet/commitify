import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitService {
    async getStagedDiff(): Promise<string | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            // Get staged changes diff
            const { stdout } = await execAsync('git diff --cached', {
                cwd: workspaceRoot,
                maxBuffer: 1024 * 1024 // 1MB buffer for large diffs
            });

            if (!stdout.trim()) {
                return null;
            }

            // Limit diff size to prevent overwhelming the AI
            const maxDiffSize = 8000; // characters
            if (stdout.length > maxDiffSize) {
                return this.truncateDiff(stdout, maxDiffSize);
            }

            return stdout;
        } catch (error: any) {
            if (error.code === 128) {
                throw new Error('Not a git repository or no git command found');
            }
            throw new Error(`Git command failed: ${error.message}`);
        }
    }

    async getFileChanges(): Promise<{ added: string[], modified: string[], deleted: string[] }> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            const { stdout } = await execAsync('git diff --cached --name-status', {
                cwd: workspaceRoot
            });

            const changes = { added: [] as string[], modified: [] as string[], deleted: [] as string[] };
            
            if (!stdout.trim()) {
                return changes;
            }

            const lines = stdout.trim().split('\n');
            for (const line of lines) {
                const [status, filename] = line.split('\t');
                switch (status) {
                    case 'A':
                        changes.added.push(filename);
                        break;
                    case 'M':
                        changes.modified.push(filename);
                        break;
                    case 'D':
                        changes.deleted.push(filename);
                        break;
                }
            }

            return changes;
        } catch (error: any) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }

    async getBranchName(): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            const { stdout } = await execAsync('git branch --show-current', {
                cwd: workspaceRoot
            });

            return stdout.trim() || 'main';
        } catch (error: any) {
            return 'main';
        }
    }

    private truncateDiff(diff: string, maxSize: number): string {
        const lines = diff.split('\n');
        let truncated = '';
        let currentSize = 0;

        for (const line of lines) {
            if (currentSize + line.length + 1 > maxSize) {
                break;
            }
            truncated += line + '\n';
            currentSize += line.length + 1;
        }

        if (truncated.length < diff.length) {
            truncated += '\n\n[Diff truncated due to size...]';
        }

        return truncated;
    }

    async isGitRepository(): Promise<boolean> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return false;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            await execAsync('git rev-parse --git-dir', {
                cwd: workspaceRoot
            });
            return true;
        } catch {
            return false;
        }
    }

    async hasStagedChanges(): Promise<boolean> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return false;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            const { stdout } = await execAsync('git diff --cached --name-only', {
                cwd: workspaceRoot
            });
            return stdout.trim().length > 0;
        } catch {
            return false;
        }
    }

    async getFileDiff(filename: string): Promise<string | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            // Get staged changes diff for specific file
            const { stdout } = await execAsync(`git diff --cached -- "${filename}"`, {
                cwd: workspaceRoot,
                maxBuffer: 1024 * 1024 // 1MB buffer for large diffs
            });

            if (!stdout.trim()) {
                return null;
            }

            // Limit diff size to prevent overwhelming the AI
            const maxDiffSize = 4000; // characters per file
            if (stdout.length > maxDiffSize) {
                return this.truncateDiff(stdout, maxDiffSize);
            }

            return stdout;
        } catch (error: any) {
            console.warn(`Failed to get diff for ${filename}:`, error);
            return null;
        }
    }
}