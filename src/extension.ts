import * as vscode from 'vscode';
import { OllamaService } from './ollama';
import { GitService } from './git';
import { SettingsProvider } from './settings';

export function activate(context: vscode.ExtensionContext) {
    console.log('Commitify extension is now active!');

    const ollamaService = new OllamaService();
    const gitService = new GitService();
    const settingsProvider = new SettingsProvider(context.extensionUri);

    // Register the generate commit message command
    const generateCommitMessageCommand = vscode.commands.registerCommand(
        'commitify.generateCommitMessage',
        async () => {
            try {
                await generateCommitMessage(ollamaService, gitService);
            } catch (error) {
                vscode.window.showErrorMessage(`Commitify Error: ${error}`);
            }
        }
    );

    // Register the settings command
    const openSettingsCommand = vscode.commands.registerCommand(
        'commitify.openSettings',
        () => {
            settingsProvider.showSettings();
        }
    );

    context.subscriptions.push(generateCommitMessageCommand);
    context.subscriptions.push(openSettingsCommand);
}

async function generateCommitMessage(ollamaService: OllamaService, gitService: GitService) {
    // Check if we're in a git repository
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    if (!gitExtension) {
        vscode.window.showErrorMessage('Git extension not found');
        return;
    }

    const git = gitExtension.getAPI(1);
    if (!git || git.repositories.length === 0) {
        vscode.window.showErrorMessage('No git repository found');
        return;
    }

    const repo = git.repositories[0];
    
    // Check if there are staged changes
    if (repo.state.indexChanges.length === 0) {
        // Check if there are unstaged changes to stage
        if (repo.state.workingTreeChanges.length === 0) {
            vscode.window.showWarningMessage('No changes found in the repository.');
            return;
        }
        
        // Ask user if they want to stage all changes
        const choice = await vscode.window.showInformationMessage(
            'No staged changes found. Would you like to stage all changes and generate a commit message?',
            'Stage All & Generate',
            'Cancel'
        );
        
        if (choice !== 'Stage All & Generate') {
            return;
        }
        
        // Stage all changes
        try {
            await repo.add([]);  // Empty array stages all changes
            vscode.window.showInformationMessage('All changes staged successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stage changes: ${error}`);
            return;
        }
    }

    // Show progress indicator
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating commit message",
        cancellable: false
    }, async (progress) => {
        try {
            const config = vscode.workspace.getConfiguration('commitify');
            const processFilesIndividually = config.get<boolean>('processFilesIndividually', true);

            if (processFilesIndividually) {
                // Two-stage processing: individual file summaries -> final commit message
                progress.report({ increment: 10, message: "Getting file changes..." });

                const fileChanges = await gitService.getFileChanges();
                const allFiles = [...fileChanges.added, ...fileChanges.modified, ...fileChanges.deleted];
                
                if (allFiles.length === 0) {
                    vscode.window.showWarningMessage('No file changes detected');
                    return;
                }

                progress.report({ increment: 20, message: "Analyzing individual files..." });

                // Process each file individually
                const fileSummaries: string[] = [];
                const totalFiles = allFiles.length;
                
                for (let i = 0; i < totalFiles; i++) {
                    const filename = allFiles[i];
                    const fileStatus = fileChanges.added.includes(filename) ? 'added' :
                                     fileChanges.deleted.includes(filename) ? 'deleted' : 'modified';
                    
                    try {
                        const fileDiff = await gitService.getFileDiff(filename);
                        if (fileDiff) {
                            const summary = await ollamaService.summarizeFileChanges(filename, fileDiff);
                            fileSummaries.push(`${filename} (${fileStatus}): ${summary}`);
                        } else {
                            fileSummaries.push(`${filename} (${fileStatus}): File ${fileStatus}`);
                        }
                    } catch (error) {
                        console.warn(`Failed to process ${filename}:`, error);
                        fileSummaries.push(`${filename} (${fileStatus}): File ${fileStatus}`);
                    }
                    
                    progress.report({
                        increment: 50 / totalFiles,
                        message: `Processing ${filename}... (${i + 1}/${totalFiles})`
                    });
                }

                progress.report({ increment: 10, message: "Crafting final commit message..." });

                // Generate final commit message from summaries
                const commitMessage = await ollamaService.generateCommitMessage(fileSummaries);
                
                progress.report({ increment: 10, message: "Setting commit message..." });

                // Set the commit message in the SCM input box
                repo.inputBox.value = commitMessage;
                
                vscode.window.showInformationMessage(`Commit message generated from ${totalFiles} file(s)!`);
            } else {
                // Legacy single-stage processing
                progress.report({ increment: 30, message: "Getting staged changes..." });

                const diff = await gitService.getStagedDiff();
                
                if (!diff) {
                    vscode.window.showWarningMessage('No changes to analyze');
                    return;
                }

                progress.report({ increment: 40, message: "Analyzing changes..." });

                // Generate commit message from full diff
                const commitMessage = await ollamaService.generateCommitMessage([diff]);
                
                progress.report({ increment: 20, message: "Setting commit message..." });

                // Set the commit message in the SCM input box
                repo.inputBox.value = commitMessage;
                
                vscode.window.showInformationMessage('Commit message generated successfully!');
            }
        } catch (error) {
            console.error('Error generating commit message:', error);
            throw error;
        }
    });
}

export function deactivate() {}