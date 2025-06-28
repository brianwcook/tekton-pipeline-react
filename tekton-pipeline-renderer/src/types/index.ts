// Re-export all types for easy importing
export * from './common';
export * from './tekton';

// Import Tekton types for aliases
import {
  TektonPipelineKind,
  TektonPipelineRunKind,
  TektonTaskRunKind,
  TektonPipelineTask,
  TektonPipelineSpec,
  TektonPipelineRunSpec,
  TektonTaskRunSpec,
  TektonTaskSpec,
  TektonStep,
  TektonCondition,
  TektonMetadata,
} from './tekton';

// Type aliases for convenience
export type PipelineKind = TektonPipelineKind;
export type PipelineRunKind = TektonPipelineRunKind;
export type TaskRunKind = TektonTaskRunKind;
export type PipelineTask = TektonPipelineTask;
export type PipelineSpec = TektonPipelineSpec;
export type PipelineRunSpec = TektonPipelineRunSpec;
export type TaskRunSpec = TektonTaskRunSpec;
export type TaskSpec = TektonTaskSpec;
export type Step = TektonStep;
export type Condition = TektonCondition;
export type Metadata = TektonMetadata; 