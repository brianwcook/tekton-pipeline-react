import React, { useState, useEffect, useCallback } from 'react';

// Import from bundled tekton-pipeline-renderer
import { PipelineRunVisualization, YAMLParser } from '../lib/tekton-renderer';

// Get VSCode API for sending messages to extension
declare const acquireVsCodeApi: () => any;
let vscode: any;
try {
    vscode = acquireVsCodeApi();
} catch (e) {
    console.log('VSCode API not available (running outside of VSCode)');
}

// Wrapper component that sends success message when topology renders
const TopologyRenderer: React.FC<{ pipelineData: any, logMessage: (msg: string) => void }> = ({ 
    pipelineData, 
    logMessage 
}) => {
    logMessage('TopologyRenderer component created');
    
    useEffect(() => {
        logMessage('TopologyRenderer useEffect triggered');
        
        // Send success message after component mounts and renders
        const timer = setTimeout(() => {
            logMessage('Topology component rendered successfully');
            
            // Send success message to VSCode extension
            if (vscode && vscode.postMessage) {
                const message = {
                    command: 'topology-rendered',
                    success: true,
                    pipelineName: pipelineData?.metadata?.name || 'unknown',
                    timestamp: Date.now()
                };
                vscode.postMessage(message);
                logMessage(`Success message sent to extension: ${JSON.stringify(message)}`);
            } else {
                logMessage(`VSCode API not available - cannot send success message. vscode: ${!!vscode}, postMessage: ${!!(vscode && vscode.postMessage)}`);
            }
        }, 1000); // Give React time to render

        return () => {
            logMessage('TopologyRenderer useEffect cleanup');
            clearTimeout(timer);
        };
    }, [pipelineData, logMessage]);

    logMessage(`TopologyRenderer rendering with pipelineData: ${pipelineData ? 'present' : 'null'}`);

    return (
        <div 
            style={{ height: '100%', width: '100%' }}
            data-topology-status="rendered"
            data-testid="topology-container"
        >
            <PipelineRunVisualization
                pipelineRun={pipelineData}
                error={null}
            />
        </div>
    );
};

const TektonVisualizationApp: React.FC = () => {
    const [pipelineData, setPipelineData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const logMessage = useCallback((message: string) => {
        console.log('TektonVisualizationApp:', message);
        if (vscode && vscode.postMessage) {
            vscode.postMessage({ command: 'log', text: message });
        }
    }, []);

    // Parse YAML content into pipeline data
    const parseYamlContent = useCallback(async (yaml: string) => {
        if (!yaml.trim()) {
            logMessage('No YAML content provided');
            return null;
        }

        try {
            logMessage(`Parsing YAML content (${yaml.length} characters)`);
            
            // Try to parse as PipelineRun first
            try {
                const pipelineRun = YAMLParser.parsePipelineRun(yaml);
                logMessage('Successfully parsed as PipelineRun');
                return pipelineRun;
            } catch (pipelineRunError) {
                logMessage(`Failed to parse as PipelineRun: ${pipelineRunError}`);
                
                // Try to parse as Pipeline and convert to PipelineRun format
                try {
                    const pipeline = YAMLParser.parsePipeline(yaml);
                    logMessage('Successfully parsed as Pipeline, converting to PipelineRun format');
                    
                    // Convert Pipeline to PipelineRun format
                    const mockPipelineRun = {
                        apiVersion: 'tekton.dev/v1beta1',
                        kind: 'PipelineRun',
                        metadata: {
                            name: pipeline.metadata?.name || 'pipeline-visualization',
                            namespace: pipeline.metadata?.namespace || 'default'
                        },
                        spec: {
                            pipelineRef: {
                                name: pipeline.metadata?.name || 'pipeline'
                            },
                            pipelineSpec: pipeline.spec
                        },
                        status: {
                            startTime: new Date().toISOString(),
                            conditions: [{
                                type: 'Succeeded',
                                status: 'Unknown',
                                reason: 'Running'
                            }],
                            taskRuns: {}
                        }
                    };
                    
                    return mockPipelineRun;
                } catch (pipelineError) {
                    logMessage(`Failed to parse as Pipeline: ${pipelineError}`);
                    throw new Error('YAML content is not a valid Tekton Pipeline or PipelineRun');
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
            setError(errorMessage);
            logMessage(`Parsing error: ${errorMessage}`);
            return null;
        }
    }, [logMessage]);

    // Load sample pipeline for demonstration
    const loadSamplePipeline = useCallback(() => {
        logMessage('Loading sample pipeline...');
        
        const samplePipelineRun = {
            apiVersion: 'tekton.dev/v1beta1',
            kind: 'PipelineRun',
            metadata: {
                name: 'sample-pipeline-run',
                namespace: 'default'
            },
            spec: {
                pipelineRef: {
                    name: 'sample-pipeline'
                },
                pipelineSpec: {
                    tasks: [
                        {
                            name: 'git-clone',
                            taskRef: {
                                name: 'git-clone'
                            },
                            params: [
                                {
                                    name: 'url',
                                    value: 'https://github.com/example/repo.git'
                                }
                            ]
                        },
                        {
                            name: 'build',
                            taskRef: {
                                name: 'buildah'
                            },
                            runAfter: ['git-clone'],
                            params: [
                                {
                                    name: 'IMAGE',
                                    value: 'example.com/app:latest'
                                }
                            ]
                        },
                        {
                            name: 'test',
                            taskRef: {
                                name: 'run-tests'
                            },
                            runAfter: ['build']
                        },
                        {
                            name: 'deploy',
                            taskRef: {
                                name: 'deploy-app'
                            },
                            runAfter: ['test']
                        }
                    ]
                }
            },
            status: {
                startTime: new Date().toISOString(),
                conditions: [{
                    type: 'Succeeded',
                    status: 'True',
                    reason: 'Succeeded'
                }],
                taskRuns: {
                    'git-clone': {
                        status: {
                            conditions: [{
                                type: 'Succeeded',
                                status: 'True'
                            }]
                        }
                    },
                    'build': {
                        status: {
                            conditions: [{
                                type: 'Succeeded',
                                status: 'True'
                            }]
                        }
                    },
                    'test': {
                        status: {
                            conditions: [{
                                type: 'Succeeded',
                                status: 'True'
                            }]
                        }
                    },
                    'deploy': {
                        status: {
                            conditions: [{
                                type: 'Succeeded',
                                status: 'True'
                            }]
                        }
                    }
                }
            }
        };

        return samplePipelineRun;
    }, [logMessage]);

    // Handle test script execution for integration tests
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'execute-test-script') {
                try {
                    logMessage('Executing test script...');
                    // Execute the test script in the webview context
                    const result = eval(`(function() { ${event.data.script} })()`);
                    
                    // Handle both synchronous and asynchronous results
                    Promise.resolve(result).then((finalResult) => {
                        if (vscode && vscode.postMessage) {
                            vscode.postMessage({
                                type: 'test-script-result',
                                result: finalResult
                            });
                        }
                    }).catch((error) => {
                        if (vscode && vscode.postMessage) {
                            vscode.postMessage({
                                type: 'test-script-result',
                                error: error.message
                            });
                        }
                    });
                } catch (error) {
                    if (vscode && vscode.postMessage) {
                        vscode.postMessage({
                            type: 'test-script-result',
                            error: error instanceof Error ? error.message : 'Script execution failed'
                        });
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [logMessage]);

    // Initialize the app
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            logMessage('Initializing Tekton Visualization App...');

            try {
                // Get initial data from VS Code
                const initialData = (window as any).initialData;
                if (initialData && initialData.yamlContent.trim()) {
                    logMessage(`Received YAML content: ${initialData.yamlContent.length} characters`);
                    // Parse the actual YAML content
                    const parsed = await parseYamlContent(initialData.yamlContent);
                    if (parsed) {
                        setPipelineData(parsed);
                        logMessage('Successfully loaded pipeline from YAML content');
                    } else {
                        logMessage('Failed to parse YAML, loading sample pipeline');
                        const sample = loadSamplePipeline();
                        setPipelineData(sample);
                    }
                } else {
                    logMessage('No YAML content provided, loading sample pipeline');
                    const sample = loadSamplePipeline();
                    setPipelineData(sample);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                logMessage(`Error: ${errorMessage}`);
            }

            setIsLoading(false);
        };

        initialize();
    }, [parseYamlContent, loadSamplePipeline, logMessage]);

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column' 
            }}>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>🚀</div>
                <div>Loading Tekton Pipeline Visualization...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '20px',
                background: 'var(--vscode-inputValidation-errorBackground)',
                border: '1px solid var(--vscode-inputValidation-errorBorder)',
                margin: '20px',
                borderRadius: '4px'
            }}>
                <h3>Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                padding: '10px 20px', 
                borderBottom: '1px solid var(--vscode-panel-border)',
                background: 'var(--vscode-panel-background)'
            }}>
                <h2 style={{ margin: 0, fontSize: '16px' }}>
                    Tekton Pipeline Visualization
                </h2>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {pipelineData ? (
                    (() => {
                        logMessage('Rendering TopologyRenderer component');
                        return (
                            <TopologyRenderer 
                                pipelineData={pipelineData}
                                logMessage={logMessage}
                            />
                        );
                    })()
                ) : (
                    (() => {
                        logMessage('No pipeline data - showing placeholder');
                        return (
                            <div style={{ 
                                padding: '20px',
                                textAlign: 'center',
                                marginTop: '50px'
                            }}>
                                <h3>No Pipeline Data Available</h3>
                                <p>Please open a valid Tekton Pipeline or PipelineRun YAML file and run the visualization command.</p>
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
};

export default TektonVisualizationApp; 