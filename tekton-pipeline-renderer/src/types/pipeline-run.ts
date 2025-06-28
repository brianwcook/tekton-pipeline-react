import { PipelineNodeModel as PfPipelineNodeModel, WhenStatus } from '@patternfly/react-topology';
import { TektonPipelineTask, TektonTaskRunKind, TektonTaskRunStatus } from './tekton';

// Type aliases for compatibility
export type PipelineTask = TektonPipelineTask;
export type TaskRunKind = TektonTaskRunKind;
export type TaskRunStatus = TektonTaskRunStatus;

export enum PipelineRunNodeType {
  SPACER_NODE = 'spacer-node',
  FINALLY_NODE = 'finally-node',
  FINALLY_GROUP = 'finally-group',
  TASK_NODE = 'pipelinerun-task-node',
  EDGE = 'pipelinerun-edge',
}

export enum runStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  Cancelled = 'Cancelled',
  Pending = 'Pending',
  Skipped = 'Skipped',
  TestFailed = 'TestFailed',
  TestWarning = 'TestWarning',
}

export type StepStatus = {
  name: string;
  startTime?: string | number;
  endTime?: string | number;
  status: runStatus;
};

export type PipelineRunNodeData = {
  task: PipelineTask;
  status?: runStatus;
  namespace: string;
  testFailCount?: number;
  testWarnCount?: number;
  whenStatus?: WhenStatus;
  steps?: StepStatus[];
  taskRun?: TaskRunKind;
  level?: number;
};

export type PipelineTaskStatus = TaskRunStatus & {
  reason: runStatus;
  duration?: string;
  testFailCount?: number;
  testWarnCount?: number;
};

export type PipelineRunTaskWithStatus = PipelineTask & {
  status: PipelineTaskStatus;
  steps?: StepStatus[];
};

export type PipelineRunNodeModel<D extends PipelineRunNodeData, T> = Omit<
  PfPipelineNodeModel,
  'type'
> & {
  data: D;
  type: T;
}; 