import * as React from 'react';
import { PipelineKind, PipelineRunKind, TaskRunKind } from '../types';
import { YAMLParser } from '../utils/yaml-parser';
import { usePipelineData } from '../hooks/usePipelineData';

export interface PipelineRendererProps {
  /** YAML string of the pipeline */
  yaml?: string;
  /** Pipeline object data */
  pipeline?: PipelineKind;
  /** PipelineRun data for execution status */
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

export const PipelineRenderer: React.FC<PipelineRendererProps> = ({
  yaml,
  pipeline,
  pipelineRun,
  taskRuns = [],
  width = '100%',
  height = '600px',
  showTaskDetails = true,
  className,
  onError,
}) => {
  const [parsedPipeline, setParsedPipeline] = React.useState<PipelineKind | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  // Parse YAML if provided
  React.useEffect(() => {
    if (yaml && !pipeline) {
      try {
        const parsed = YAMLParser.parsePipeline(yaml);
        setParsedPipeline(parsed);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to parse pipeline YAML');
        setError(error);
        onError?.(error);
      }
    } else if (pipeline) {
      setParsedPipeline(pipeline);
      setError(null);
    }
  }, [yaml, pipeline, onError]);

  // Use the pipeline data hook to get processed data
  const pipelineData = usePipelineData(parsedPipeline, pipelineRun, taskRuns);

  if (error) {
    return (
      <div className={`pipeline-renderer-error ${className || ''}`}>
        <div style={{ padding: '20px', textAlign: 'center', color: '#d73a49' }}>
          <h3>Error Loading Pipeline</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!parsedPipeline && !pipeline) {
    return (
      <div className={`pipeline-renderer-loading ${className || ''}`}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No pipeline data provided</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`pipeline-renderer ${className || ''}`}
      style={{ width, height }}
    >
      <div style={{ padding: '20px' }}>
        <h3>Pipeline: {pipelineData.pipeline?.metadata?.name}</h3>
        <div>
          <h4>Tasks ({pipelineData.tasks.length}):</h4>
          <ul>
            {pipelineData.tasks.map((task) => (
              <li key={task.name}>
                {task.name} - {task.status.status}
                {showTaskDetails && task.status.duration && (
                  <span> (Duration: {Math.round(Number(task.status.duration) / 1000)}s)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}; 