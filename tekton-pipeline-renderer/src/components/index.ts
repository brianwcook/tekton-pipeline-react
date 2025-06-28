// Components-only exports for VS Code extensions
// Optimized to exclude heavy dependencies when possible

export { default as PipelineRunVisualization } from './PipelineRunVisualization';
export { default as VisualizationFactory } from './VisualizationFactory';
export { TopologyVisualization } from './TopologyVisualization';

// Node components
export { default as PipelineRunNode } from './nodes/PipelineRunNode';

// Re-export types that are commonly needed
export type {
  PipelineRunNodeData,
  PipelineRunNodeType,
  PipelineRunTaskWithStatus,
} from '../types/pipeline-run'; 