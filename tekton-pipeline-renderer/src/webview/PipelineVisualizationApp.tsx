import * as React from 'react';
import { useState, useEffect } from 'react';

interface PipelineVisualizationAppProps {
    vscode: any;
}

export const PipelineVisualizationApp: React.FC<PipelineVisualizationAppProps> = ({ vscode }) => {
    const [yamlContent, setYamlContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const messageListener = (event: MessageEvent) => {
            const message = event.data;
            
            switch (message.command) {
                case 'loadPipeline':
                    setYamlContent(message.yamlContent);
                    setLoading(false);
                    break;
            }
        };

        window.addEventListener('message', messageListener);
        vscode.postMessage({ command: 'ready' });

        return () => {
            window.removeEventListener('message', messageListener);
        };
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                <h1>🚀 Tekton Pipeline Viewer</h1>
                <p>✅ React app is loading...</p>
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    Loading pipeline data...
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>🚀 Tekton Pipeline Viewer</h1>
            <p>✅ React app loaded successfully!</p>
            <p>✅ YAML data received: {yamlContent.length} characters</p>
            
            <div style={{ marginTop: '20px' }}>
                <h2>📄 Pipeline YAML:</h2>
                <pre style={{ 
                    backgroundColor: '#f8f8f8', 
                    padding: '15px', 
                    borderRadius: '4px', 
                    overflow: 'auto',
                    maxHeight: '400px',
                    fontSize: '12px',
                    border: '1px solid #ddd'
                }}>
                    {yamlContent}
                </pre>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                <p><strong>🎯 Next Step:</strong> Replace this with the PatternFly topology visualization!</p>
                <p>React is working properly. Now we need to fix the package import.</p>
            </div>
        </div>
    );
}; 