import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

// Helper to ensure bundle mode before tests
async function ensureBundleMode() {
  const rootPath = path.resolve(__dirname, '../../../..');
  
  return new Promise<void>((resolve, reject) => {
            exec('npm run propagate', { cwd: rootPath }, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.log('Bundle propagation output:', stdout);
        console.log('Bundle propagation errors:', stderr);
        reject(error);
      } else {
        console.log('✅ Bundle mode activated for testing');
        resolve();
      }
    });
  });
}

// Track webview panels created during tests
let currentWebviewPanel: vscode.WebviewPanel | undefined;

// Helper to get active webview panel
function getActiveWebviewPanel(): vscode.WebviewPanel | undefined {
  return currentWebviewPanel;
}

// Hook into webview panel creation
function monitorWebviewPanels() {
  const originalCreateWebviewPanel = vscode.window.createWebviewPanel;
  
  (vscode.window as any).createWebviewPanel = function(
    viewType: string, 
    title: string, 
    showOptions: vscode.ViewColumn | { viewColumn: vscode.ViewColumn; preserveFocus?: boolean }, 
    options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
  ) {
    const panel = originalCreateWebviewPanel.call(this, viewType, title, showOptions, options);
    currentWebviewPanel = panel;
    
    // Clean up when panel is disposed
    panel.onDidDispose(() => {
      if (currentWebviewPanel === panel) {
        currentWebviewPanel = undefined;
      }
    });
    
    return panel;
  };
}

suite('Tekton Topology Simple Integration Tests', () => {
  
  // Ensure bundle mode before running topology tests
  suiteSetup(async function() {
    this.timeout(30000); // Allow time for bundling
    console.log('🔄 Setting up bundle mode for simple topology tests...');
    await ensureBundleMode();
    
    // Start monitoring webview panels
    monitorWebviewPanels();
    console.log('✅ Webview panel monitoring activated');
  });

  test('should create webview with PatternFly topology structure', async function() {
    this.timeout(10000);
    
    // 1. Create test pipeline YAML
    const testYaml = `apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: test-pipeline
spec:
  tasks:
  - name: git-clone
    taskRef:
      name: git-clone
  - name: build
    taskRef:
      name: buildah
    runAfter: [git-clone]`;

    // 2. Create document and open in editor
    const document = await vscode.workspace.openTextDocument({
      content: testYaml,
      language: 'yaml'
    });
    
    await vscode.window.showTextDocument(document);

    // 3. Trigger pipeline visualization command
    await vscode.commands.executeCommand('tekton.visualizePipeline');
    
    // 4. Wait for webview to be created
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Get the webview panel
    const panel = getActiveWebviewPanel();
    assert.ok(panel, 'Webview panel should be created');

    // 6. Verify webview basic properties
    assert.equal(panel.viewType, 'tektonVisualization', 'Should have correct view type');
    assert.ok(panel.title.includes('Pipeline'), 'Should have Pipeline in title');

    // 7. Check HTML contains topology infrastructure
    const html = panel.webview.html;
    assert.ok(html.includes('patternfly'), 'Should load PatternFly CSS');
    assert.ok(html.includes('react'), 'Should load React');
    assert.ok(html.includes('root'), 'Should have React root element');
    assert.ok(html.includes('webview.js'), 'Should load webview script');

    // 8. Verify YAML content is passed to webview
    assert.ok(html.includes('git-clone'), 'Should contain git-clone task from YAML');
    assert.ok(html.includes('build'), 'Should contain build task from YAML');

    // 9. Check for PatternFly topology specific elements in HTML structure
    assert.ok(
      html.includes('Loading Tekton Pipeline Visualization'), 
      'Should show loading message'
    );

    console.log('✅ Webview created successfully with topology infrastructure');
    
    // 10. Clean up
    panel.dispose();
  });

  test('should handle parallel pipeline YAML structure', async function() {
    this.timeout(10000);
    
    const parallelYaml = `apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: parallel-tests
spec:
  tasks:
  - name: setup
    taskRef:
      name: setup-task
  - name: test-unit
    taskRef:
      name: test-task
    runAfter: [setup]
  - name: test-integration
    taskRef:
      name: test-task  
    runAfter: [setup]`;

    const document = await vscode.workspace.openTextDocument({
      content: parallelYaml,
      language: 'yaml'
    });
    
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand('tekton.visualizePipeline');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const panel = getActiveWebviewPanel();
    assert.ok(panel, 'Webview panel should be created');

    const html = panel.webview.html;
    
    // Verify all parallel tasks are included in the HTML
    assert.ok(html.includes('setup'), 'Should contain setup task');
    assert.ok(html.includes('test-unit'), 'Should contain test-unit task');
    assert.ok(html.includes('test-integration'), 'Should contain test-integration task');

    console.log('✅ Parallel pipeline structure detected in webview');

    panel.dispose();
  });

  test('should handle pipeline run command', async function() {
    this.timeout(10000);
    
    const pipelineRunYaml = `apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: test-pipeline-run
spec:
  pipelineRef:
    name: test-pipeline`;

    const document = await vscode.workspace.openTextDocument({
      content: pipelineRunYaml,
      language: 'yaml'
    });
    
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand('tekton.visualizePipelineRun');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const panel = getActiveWebviewPanel();
    assert.ok(panel, 'Webview panel should be created for PipelineRun');
    assert.ok(panel.title.includes('Pipeline Run'), 'Should have Pipeline Run in title');

    const html = panel.webview.html;
    assert.ok(html.includes('test-pipeline-run'), 'Should contain PipelineRun name');

    console.log('✅ PipelineRun webview created successfully');

    panel.dispose();
  });

  test('should create webview with empty YAML content', async function() {
    this.timeout(10000);
    
    // Test with no active editor
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await vscode.commands.executeCommand('tekton.visualizePipeline');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const panel = getActiveWebviewPanel();
    assert.ok(panel, 'Webview panel should be created even with no content');

    const html = panel.webview.html;
    assert.ok(html.includes('patternfly'), 'Should still load PatternFly CSS');
    assert.ok(html.includes('root'), 'Should have React root element');

    console.log('✅ Webview handles empty content gracefully');

    panel.dispose();
  });
}); 