export enum PipelineRunNodeType {
  TASK_NODE = 'task-node',
  FINALLY_NODE = 'finally-node',
  FINALLY_GROUP = 'finally-group',
  SPACER_NODE = 'spacer-node',
  EDGE = 'edge',
}

export interface PipelineRunNodeData {
  id: string;
  label: string;
  status: string;
  task?: any;
  steps?: any[];
  whenStatus?: any;
  testFailCount?: number;
  testWarnCount?: number;
  duration?: string;
  startTime?: string;
  endTime?: string;
}

export interface PipelineRunNodeModel {
  id: string;
  type: PipelineRunNodeType;
  label: string;
  data: PipelineRunNodeData;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface PipelineEdgeModel {
  id: string;
  type: PipelineRunNodeType.EDGE;
  source: string;
  target: string;
  data?: any;
}

export interface PipelineGraphModel {
  id: string;
  type: string;
  layout: string;
  nodes: PipelineRunNodeModel[];
  edges: PipelineEdgeModel[];
  graph: {
    id: string;
    type: string;
    layout: string;
  };
} 