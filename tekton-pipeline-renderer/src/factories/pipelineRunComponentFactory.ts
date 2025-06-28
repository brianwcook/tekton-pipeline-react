import {
  ModelKind,
  GraphComponent,
  DefaultTaskGroup,
  SpacerNode,
  ComponentFactory,
  TaskEdge,
} from '@patternfly/react-topology';
import PipelineRunNode from '../components/nodes/PipelineRunNode';
import { PipelineRunNodeType } from '../types/pipeline-run';

export const pipelineRunComponentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
  if (kind === ModelKind.graph) {
    return GraphComponent;
  }
  switch (type) {
    case PipelineRunNodeType.TASK_NODE:
    case PipelineRunNodeType.FINALLY_NODE:
      return PipelineRunNode as any;
    case PipelineRunNodeType.FINALLY_GROUP:
      return DefaultTaskGroup;
    case PipelineRunNodeType.SPACER_NODE:
      return SpacerNode;
    case PipelineRunNodeType.EDGE:
      return TaskEdge;
    default:
      return undefined;
  }
}; 