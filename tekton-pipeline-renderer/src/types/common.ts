import { TektonPipelineTask, TektonPipelineRunKind, TektonTaskRunKind } from './tekton';

export type RunStatus = 
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Cancelled'
  | 'Skipped'
  | 'Unknown';

export type StepStatus = {
  name: string;
  status: RunStatus;
  startTime?: string;
  endTime?: string;
  duration?: string;
  exitCode?: number;
  reason?: string;
  message?: string;
};

export type PipelineTaskStatus = {
  name: string;
  status: RunStatus;
  startTime?: string;
  endTime?: string;
  duration?: string;
  steps?: StepStatus[];
  results?: Array<{
    name: string;
    value: string;
  }>;
  retries?: number;
  reason?: string;
  message?: string;
};

export type PipelineTaskWithStatus = {
  name: string;
  status: PipelineTaskStatus;
  task: TektonPipelineTask; // PipelineTask from the spec
};

export type PipelineRunData = {
  pipelineRun: TektonPipelineRunKind | null; // PipelineRunKind
  taskRuns: TektonTaskRunKind[]; // TaskRunKind[]
  status: RunStatus;
  startTime?: string;
  endTime?: string;
  duration?: string;
  tasks: PipelineTaskWithStatus[];
  results?: Array<{
    name: string;
    value: string;
  }>;
}; 