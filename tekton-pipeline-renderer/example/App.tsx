import * as React from 'react';
import { YAMLParser, PipelineRunVisualization } from '../src';

const EXAMPLE_YAML = `apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: demo-pipeline-run
  namespace: default
spec:
  pipelineSpec:
    tasks:
    - name: fetch-source
      taskRef:
        name: git-clone
    - name: build-image
      taskRef:
        name: buildah
      runAfter:
      - fetch-source
    - name: test-app
      taskRef:
        name: pytest
      runAfter:
      - fetch-source
    - name: deploy-app
      taskRef:
        name: kubectl-deploy
      runAfter:
      - build-image
      - test-app
  status:
    conditions:
    - type: Succeeded
      status: True`;

const App: React.FC = () => {
  const [yamlInput, setYamlInput] = React.useState<string>(EXAMPLE_YAML);
  const [pipelineRun, setPipelineRun] = React.useState<any>(null);
  const [parseError, setParseError] = React.useState<string>('');

  const parseYaml = React.useCallback(() => {
    try {
      const parsed = YAMLParser.parsePipelineRun(yamlInput);
      setPipelineRun(parsed);
      setParseError('');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Unknown parsing error');
      setPipelineRun(null);
    }
  }, [yamlInput]);

  // Parse initial YAML on component mount
  React.useEffect(() => {
    parseYaml();
  }, [parseYaml]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Tekton Pipeline Renderer Demo</h1>
      <p>Paste your Tekton PipelineRun YAML below and see it visualized!</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        height: 'calc(100vh - 120px)'
      }}>
        {/* Left Panel - YAML Input */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>📝 YAML Input</h2>
            <button 
              onClick={parseYaml}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Parse & Render
            </button>
          </div>
          
          <textarea
            value={yamlInput}
            onChange={(e) => setYamlInput(e.target.value)}
            style={{
              flex: 1,
              fontFamily: 'Monaco, "Courier New", monospace',
              fontSize: '12px',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'none'
            }}
            placeholder="Paste your Tekton PipelineRun YAML here..."
          />
          
          {parseError && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#ffebee', 
              border: '1px solid #f44336',
              borderRadius: '4px',
              color: '#c62828'
            }}>
              <strong>❌ Parse Error:</strong>
              <pre style={{ margin: '8px 0 0 0', fontSize: '12px' }}>{parseError}</pre>
            </div>
          )}
        </div>

        {/* Right Panel - Visualization */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '10px'
        }}>
          <h2 style={{ margin: 0 }}>🎨 Pipeline Visualization</h2>
          
          <div style={{ 
            flex: 1,
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
            overflow: 'hidden'
          }}>
            {parseError ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                color: '#666'
              }}>
                <p>Fix the YAML error above to see the visualization</p>
              </div>
            ) : pipelineRun ? (
              <PipelineRunVisualization
                pipelineRun={pipelineRun}
              />
            ) : (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                color: '#666'
              }}>
                <p>Loading visualization...</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div style={{ 
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        padding: '10px 20px',
        backgroundColor: pipelineRun ? '#e8f5e8' : parseError ? '#ffebee' : '#fff3cd',
        borderTop: '1px solid #ddd',
        fontSize: '14px'
      }}>
        <span>
          {parseError 
            ? '❌ YAML Parse Error' 
            : pipelineRun 
              ? `✅ Successfully rendered pipeline: ${pipelineRun.metadata.name}` 
              : '🔄 Ready to parse YAML'}
        </span>
      </div>
    </div>
  );
};

export default App; 