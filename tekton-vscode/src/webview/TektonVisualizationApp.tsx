import React, { useState, useEffect, useCallback } from 'react';

// Import from bundled tekton-pipeline-renderer
import { PipelineRunVisualization, YAMLParser } from '../lib/tekton-renderer';

const TektonVisualizationApp: React.FC = () => {
    const [pipelineData, setPipelineData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Parse YAML content into pipeline data
    const parseYamlContent = useCallback(async (yaml: string) => {
        if (!yaml.trim()) {
            return null;
        }

        try {
            // Try to parse as PipelineRun first
            try {
                const pipelineRun = YAMLParser.parsePipelineRun(yaml);
                return pipelineRun;
            } catch (pipelineRunError) {
                // Try to parse as Pipeline and convert to PipelineRun format
                try {
                    const pipeline = YAMLParser.parsePipeline(yaml);
                    
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
                    throw new Error('YAML content is not a valid Tekton Pipeline or PipelineRun');
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
            setError(errorMessage);
            return null;
        }
    }, []);

    // Load sample pipeline for demonstration
    const loadSamplePipeline = useCallback(() => {
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
                    status: 'True'
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
    }, []);

    // Initialize the app
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);

            try {
                // Get initial data from VS Code
                const initialData = (window as any).initialData;
                if (initialData && initialData.yamlContent.trim()) {
                    // Parse the actual YAML content
                    const parsed = await parseYamlContent(initialData.yamlContent);
                    if (parsed) {
                        setPipelineData(parsed);
                    } else {
                        const sample = loadSamplePipeline();
                        setPipelineData(sample);
                    }
                } else {
                    const sample = loadSamplePipeline();
                    setPipelineData(sample);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
            }

            setIsLoading(false);
        };

        initialize();
    }, [parseYamlContent, loadSamplePipeline]);

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
                    <div style={{ height: '100%', width: '100%' }}>
                        <PipelineRunVisualization
                            pipelineRun={pipelineData}
                            error={null}
                        />
                    </div>
                ) : (
                    <div style={{ 
                        padding: '20px',
                        textAlign: 'center',
                        marginTop: '50px'
                    }}>
                        <h3>No Pipeline Data Available</h3>
                        <p>Please open a valid Tekton Pipeline or PipelineRun YAML file and run the visualization command.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TektonVisualizationApp; 