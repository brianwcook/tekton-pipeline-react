import {
  DagreLayoutOptions,
  Graph,
  LayoutFactory,
  PipelineDagreLayout,
} from '@patternfly/react-topology';
import * as dagre from 'dagre';

// Constants from konflux-ui
const DEFAULT_NODE_SEPERATION_HORIZONTAL = 50;
const EXPANDED_NODE_SEPARATION_HORIZONTAL = 70;
const NODE_SEPARATION_HORIZONTAL = 30;
const NODE_SEPARATION_VERTICAL = 20;
const WHEN_EXPRESSION_SPACING = 30;

export enum PipelineLayout {
  WORKFLOW_VISUALIZATION = 'workflow-visualization',
  EXPANDED_WORKFLOW_VISUALIZATION = 'expanded-workflow-visualization',
  PIPELINERUN_VISUALIZATION = 'pipelinerun-visualization',
  PIPELINERUN_VISUALIZATION_SPACED = 'pipelinerun-visualization-with-when-expression',
  COMMIT_VISUALIZATION = 'commit-visualization',
}

const DAGRE_SHARED_PROPS: dagre.GraphLabel = {
  nodesep: NODE_SEPARATION_VERTICAL,
  ranksep: NODE_SEPARATION_HORIZONTAL,
};

const WORKFLOW_VISUALIZATION_PROPS: dagre.GraphLabel = {
  ...DAGRE_SHARED_PROPS,
  ranksep: 10,
};

const EXPANDED_WORKFLOW_VISUALIZATION_PROPS: dagre.GraphLabel = {
  ...DAGRE_SHARED_PROPS,
  ranksep: EXPANDED_NODE_SEPARATION_HORIZONTAL,
};

export const PIPELINERUN_VISUALIZATION_PROPS: dagre.GraphLabel = {
  ...DAGRE_SHARED_PROPS,
  ranksep: DEFAULT_NODE_SEPERATION_HORIZONTAL,
};

export const PIPELINERUN_VISUALIZATION_SPACED_PROPS: dagre.GraphLabel = {
  ...DAGRE_SHARED_PROPS,
  ranksep: DEFAULT_NODE_SEPERATION_HORIZONTAL + WHEN_EXPRESSION_SPACING,
};

export const COMMIT_VISUALIZATION_PROPS: dagre.GraphLabel = {
  ...DAGRE_SHARED_PROPS,
  ranksep: EXPANDED_NODE_SEPARATION_HORIZONTAL,
};

export const getLayoutData = (layout: PipelineLayout): dagre.GraphLabel | null => {
  switch (layout) {
    case PipelineLayout.WORKFLOW_VISUALIZATION:
      return WORKFLOW_VISUALIZATION_PROPS;
    case PipelineLayout.EXPANDED_WORKFLOW_VISUALIZATION:
      return EXPANDED_WORKFLOW_VISUALIZATION_PROPS;
    case PipelineLayout.COMMIT_VISUALIZATION:
      return COMMIT_VISUALIZATION_PROPS;
    case PipelineLayout.PIPELINERUN_VISUALIZATION:
      return PIPELINERUN_VISUALIZATION_PROPS;
    case PipelineLayout.PIPELINERUN_VISUALIZATION_SPACED:
      return PIPELINERUN_VISUALIZATION_SPACED_PROPS;
    default:
      return null;
  }
};

export const layoutFactory: LayoutFactory = (layout: string, graph: Graph) => {
  const layoutData = getLayoutData(layout as PipelineLayout);
  if (!layoutData) {
    return undefined;
  }
  return new PipelineDagreLayout(graph, {
    ...layoutData,
    ignoreGroups: true,
  } as DagreLayoutOptions);
}; 