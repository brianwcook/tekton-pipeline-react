import * as React from 'react';
import { PipelineRunKind, TaskRunKind } from '../types';
import { YAMLParser } from '../utils/yaml-parser';
import { usePipelineRunData } from '../hooks/usePipelineRunData';

export interface PipelineRunRendererProps {
  /** YAML string of the pipeline run */
  yaml?: string;
  /** PipelineRun object data */
  pipelineRun?: PipelineRunKind;
  /** TaskRuns for detailed execution data */
  taskRuns?: TaskRunKind[];
  /** Width of the visualization */
  width?: number | string;
  /** Height of the visualization */
  height?: number | string;
  /** Show task details on hover */
  showTaskDetails?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Error handler */
  onError?: (error: Error) => void;
}

export const PipelineRunRenderer: React.FC<PipelineRunRendererProps> = ({
  yaml,
  pipelineRun,
  taskRuns = [],
  width = '100%',
  height = '600px',
  showTaskDetails = true,
  className,
  onError,
}) => {
  const [parsedPipelineRun, setParsedPipelineRun] = React.useState<PipelineRunKind | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  // Parse YAML if provided
  React.useEffect(() => {
    if (yaml && !pipelineRun) {
      try {
        const parsed = YAMLParser.parsePipelineRun(yaml);
        setParsedPipelineRun(parsed);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to parse pipeline run YAML');
        setError(error);
        onError?.(error);
      }
    } else if (pipelineRun) {
      setParsedPipelineRun(pipelineRun);
      setError(null);
    }
  }, [yaml, pipelineRun, onError]);

  // Use the pipeline run data hook to get processed data
  const pipelineRunData = usePipelineRunData(parsedPipelineRun, taskRuns);

  if (error) {
    return (
      <div className={`pipeline-run-renderer-error ${className || ''}`}>
        <div style={{ padding: '20px', textAlign: 'center', color: '#d73a49' }}>
          <h3>Error Loading Pipeline Run</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!parsedPipelineRun && !pipelineRun) {
    return (
      <div className={`pipeline-run-renderer-loading ${className || ''}`}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No pipeline run data provided</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return '#28a745';
      case 'Failed':
        return '#d73a49';
      case 'Running':
        return '#0366d6';
      case 'Cancelled':
        return '#6a737d';
      case 'Skipped':
        return '#6a737d';
      default:
        return '#6a737d';
    }
  };

  return (
    <div 
      className={`pipeline-run-renderer ${className || ''}`}
      style={{ width, height }}
    >
      <div style={{ padding: '20px' }}>
        <h3>Pipeline Run: {pipelineRunData.pipelineRun?.metadata?.name}</h3>
        <div style={{ marginBottom: '20px' }}>
          <span style={{ 
            padding: '4px 8px', 
            borderRadius: '4px', 
            backgroundColor: getStatusColor(pipelineRunData.status),
            color: 'white',
            fontWeight: 'bold'
          }}>
            {pipelineRunData.status}
          </span>
          {pipelineRunData.duration && (
            <span style={{ marginLeft: '10px', color: '#6a737d' }}>
              Duration: {Math.round(Number(pipelineRunData.duration) / 1000)}s
            </span>
          )}
        </div>
        
        <div>
          <h4>Tasks ({pipelineRunData.tasks.length}):</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {pipelineRunData.tasks.map((task) => (
              <li key={task.name} style={{ 
                margin: '8px 0', 
                padding: '8px', 
                border: '1px solid #e1e4e8',
                borderRadius: '4px',
                backgroundColor: '#f6f8fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>{task.name}</span>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    backgroundColor: getStatusColor(task.status.status),
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {task.status.status}
                  </span>
                </div>
                {showTaskDetails && task.status.duration && (
                  <div style={{ fontSize: '12px', color: '#6a737d', marginTop: '4px' }}>
                    Duration: {Math.round(Number(task.status.duration) / 1000)}s
                  </div>
                )}
                {showTaskDetails && task.status.steps && task.status.steps.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Steps:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {task.status.steps.map((step) => (
                        <li key={step.name} style={{ fontSize: '12px' }}>
                          {step.name} - {step.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}; 