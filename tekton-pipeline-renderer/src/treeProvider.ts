import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class TektonTreeProvider implements vscode.TreeDataProvider<TektonItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TektonItem | undefined | null | void> = new vscode.EventEmitter<TektonItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TektonItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TektonItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TektonItem): Promise<TektonItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            return [];
        }

        if (!element) {
            // Root level - show workspace folders
            return this.getWorkspaceFolders();
        } else if (element.contextValue === 'workspace') {
            // Show pipeline files in workspace
            return this.getPipelineFiles(element.resourceUri);
        }

        return [];
    }

    private async getWorkspaceFolders(): Promise<TektonItem[]> {
        const folders: TektonItem[] = [];
        
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                const hasPipelineFiles = await this.hasYamlFiles(folder.uri);
                if (hasPipelineFiles) {
                    folders.push(new TektonItem(
                        folder.name,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'workspace',
                        folder.uri
                    ));
                }
            }
        }

        return folders;
    }

    private async getPipelineFiles(workspaceUri: vscode.Uri): Promise<TektonItem[]> {
        const files: TektonItem[] = [];
        
        try {
            const yamlFiles = await this.findYamlFiles(workspaceUri);
            
            for (const file of yamlFiles) {
                const content = await fs.promises.readFile(file.fsPath, 'utf8');
                const fileType = this.detectTektonResourceType(content);
                
                if (fileType) {
                    const basename = path.basename(file.fsPath);
                    const item = new TektonItem(
                        basename,
                        vscode.TreeItemCollapsibleState.None,
                        fileType,
                        file
                    );
                    
                    // Set appropriate icon
                    item.iconPath = this.getIconForResourceType(fileType);
                    
                    // Add command to open visualization
                    item.command = {
                        command: 'tektonViewer.openPipeline',
                        title: 'Open Pipeline Visualization',
                        arguments: [file]
                    };
                    
                    files.push(item);
                }
            }
        } catch (error) {
            console.error('Error loading pipeline files:', error);
        }

        return files;
    }

    private async hasYamlFiles(uri: vscode.Uri): Promise<boolean> {
        try {
            const files = await this.findYamlFiles(uri);
            return files.length > 0;
        } catch (error) {
            return false;
        }
    }

    private async findYamlFiles(uri: vscode.Uri): Promise<vscode.Uri[]> {
        const files: vscode.Uri[] = [];
        const yamlPattern = new vscode.RelativePattern(uri, '**/*.{yaml,yml}');
        const yamlFiles = await vscode.workspace.findFiles(yamlPattern, '**/node_modules/**');
        
        return yamlFiles;
    }

    private detectTektonResourceType(content: string): string | null {
        // Simple detection based on kind field
        const kindMatch = content.match(/kind:\s*([^\n\r]+)/);
        if (!kindMatch) return null;

        const kind = kindMatch[1].trim();
        const tektonKinds = [
            'Pipeline',
            'PipelineRun', 
            'Task',
            'TaskRun',
            'ClusterTask',
            'TriggerBinding',
            'TriggerTemplate',
            'EventListener'
        ];

        if (tektonKinds.includes(kind)) {
            return kind.toLowerCase();
        }

        // Check if it's a Tekton resource by apiVersion
        if (content.includes('apiVersion: tekton.dev/')) {
            return 'tekton-resource';
        }

        return null;
    }

    private getIconForResourceType(resourceType: string): vscode.ThemeIcon {
        const iconMap: { [key: string]: string } = {
            'pipeline': 'workflow',
            'pipelinerun': 'play',
            'task': 'gear',
            'taskrun': 'play-circle',
            'clustertask': 'server',
            'triggerbinding': 'link',
            'triggertemplate': 'file-code',
            'eventlistener': 'radio-tower',
            'tekton-resource': 'file-code'
        };

        return new vscode.ThemeIcon(iconMap[resourceType] || 'file');
    }
}

class TektonItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly resourceUri?: vscode.Uri
    ) {
        super(label, collapsibleState);
        
        if (resourceUri) {
            this.resourceUri = resourceUri;
            this.tooltip = resourceUri.fsPath;
        }
    }
} 