import React, { useState, useEffect, useCallback } from 'react';
import { PipelineRunVisualization } from '@konflux/tekton-pipeline-renderer';
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';
import { PipelineRunData } from '@konflux/tekton-pipeline-renderer/types';
import { 
    Card,
    CardBody,
    Alert,
    AlertGroup,
    Spinner,
    Title,
    Button,
    Toolbar,
    ToolbarContent,
    ToolbarItem
} from '@patternfly/react-core';

interface WindowWithVSCode extends Window {
    vscode?: any;
    initialData?: {
        yamlContent: string;
        type: string;
    };
    postMessage?: (message: any) => void;
}

declare const window: WindowWithVSCode;

interface AlertMessage {
    id: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    title: string;
    message: string;
}

const TektonVisualizationApp: React.FC = () => {
    const [pipelineData, setPipelineData] = useState<PipelineRunData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [alerts, setAlerts] = useState<AlertMessage[]>([]);
    const [yamlContent, setYamlContent] = useState<string>('');
    const [visualizationType, setVisualizationType] = useState<string>('pipelinerun');

    const addAlert = useCallback((type: AlertMessage['type'], title: string, message: string) => {
        const alert: AlertMessage = {
            id: `alert-${Date.now()}`,
            type,
            title,
            message
        };
        setAlerts(prev => [...prev, alert]);
        
        // Auto-remove alerts after 5 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 5000);
    }, []);

    const removeAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, []);

    const logMessage = useCallback((message: string) => {
        console.log('TektonVisualizationApp:', message);
        if (window.postMessage) {
            window.postMessage({ command: 'log', text: message });
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
                    const mockPipelineRun: PipelineRunData = {
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
            addAlert('danger', 'YAML Parsing Error', errorMessage);
            logMessage(`Parsing error: ${errorMessage}`);
            return null;
        }
    }, [addAlert, logMessage]);

    // Load sample pipeline for demonstration
    const loadSamplePipeline = useCallback(async () => {
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

        return samplePipelineRun as PipelineRunData;
    }, [logMessage]);

    // Initialize the app
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            logMessage('Initializing Tekton Visualization App...');

            // Get initial data from VS Code
            const initialData = window.initialData;
            if (initialData) {
                logMessage(`Received initial data: type=${initialData.type}, yaml length=${initialData.yamlContent.length}`);
                setYamlContent(initialData.yamlContent);
                setVisualizationType(initialData.type);

                if (initialData.yamlContent.trim()) {
                    const parsed = await parseYamlContent(initialData.yamlContent);
                    if (parsed) {
                        setPipelineData(parsed);
                        addAlert('success', 'YAML Loaded', 'Successfully parsed Tekton YAML content');
                    }
                } else {
                    logMessage('No YAML content provided, loading sample pipeline');
                    const sample = await loadSamplePipeline();
                    setPipelineData(sample);
                    addAlert('info', 'Sample Loaded', 'Loaded sample pipeline for demonstration');
                }
            } else {
                logMessage('No initial data found, loading sample pipeline');
                const sample = await loadSamplePipeline();
                setPipelineData(sample);
                addAlert('info', 'Sample Loaded', 'Loaded sample pipeline for demonstration');
            }

            setIsLoading(false);
        };

        initialize();
    }, [parseYamlContent, loadSamplePipeline, addAlert, logMessage]);

    const handleRefresh = useCallback(async () => {
        if (yamlContent.trim()) {
            setIsLoading(true);
            const parsed = await parseYamlContent(yamlContent);
            if (parsed) {
                setPipelineData(parsed);
                addAlert('success', 'Refreshed', 'Pipeline visualization updated');
            }
            setIsLoading(false);
        }
    }, [yamlContent, parseYamlContent, addAlert]);

    const handleLoadSample = useCallback(async () => {
        setIsLoading(true);
        const sample = await loadSamplePipeline();
        setPipelineData(sample);
        setYamlContent('');
        addAlert('info', 'Sample Loaded', 'Loaded sample pipeline for demonstration');
        setIsLoading(false);
    }, [loadSamplePipeline, addAlert]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spinner size="lg" />
                <Title headingLevel="h3" size="lg" style={{ marginTop: '1rem' }}>
                    Loading Tekton Pipeline Visualization...
                </Title>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AlertGroup isToast>
                {alerts.map(alert => (
                    <Alert
                        key={alert.id}
                        variant={alert.type}
                        title={alert.title}
                        isLiveRegion
                        onClose={() => removeAlert(alert.id)}
                    >
                        {alert.message}
                    </Alert>
                ))}
            </AlertGroup>

            <Toolbar>
                <ToolbarContent>
                    <ToolbarItem>
                        <Title headingLevel="h2" size="lg">
                            Tekton {visualizationType === 'pipeline' ? 'Pipeline' : 'Pipeline Run'} Visualization
                        </Title>
                    </ToolbarItem>
                    <ToolbarItem variant="separator" />
                    <ToolbarItem>
                        <Button variant="secondary" onClick={handleRefresh} isDisabled={!yamlContent.trim()}>
                            Refresh
                        </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                        <Button variant="tertiary" onClick={handleLoadSample}>
                            Load Sample
                        </Button>
                    </ToolbarItem>
                </ToolbarContent>
            </Toolbar>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {pipelineData ? (
                    <Card style={{ height: '100%' }}>
                        <CardBody style={{ padding: 0, height: '100%' }}>
                            <PipelineRunVisualization
                                pipelineRun={pipelineData}
                                onNodeClick={(node) => {
                                    logMessage(`Node clicked: ${node.getId()}`);
                                    addAlert('info', 'Node Selected', `Selected: ${node.getLabel()}`);
                                }}
                                onNodeDoubleClick={(node) => {
                                    logMessage(`Node double-clicked: ${node.getId()}`);
                                    addAlert('info', 'Node Double-Clicked', `Double-clicked: ${node.getLabel()}`);
                                }}
                            />
                        </CardBody>
                    </Card>
                ) : (
                    <div className="error-container">
                        <Title headingLevel="h3" size="md">No Pipeline Data Available</Title>
                        <p>Please open a valid Tekton Pipeline or PipelineRun YAML file and run the visualization command.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TektonVisualizationApp; 