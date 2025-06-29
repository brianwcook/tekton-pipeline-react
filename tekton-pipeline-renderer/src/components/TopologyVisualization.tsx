import * as React from 'react';
import {
  GRAPH_LAYOUT_END_EVENT,
  Model,
  Node,
  Visualization,
  VisualizationSurface,
  VisualizationProvider,
  TopologyView,
  Controller,
  LayoutFactory,
  ComponentFactory,
  ModelKind,
  GraphComponent,
  DefaultTaskGroup,
  SpacerNode,
  TaskEdge,
  PipelineDagreLayout,
  DagreLayoutOptions,
} from '@patternfly/react-topology';
import {
  TektonPipelineRunKind as PipelineRunKind,
  TektonTaskRunKind as TaskRunKind,
} from '../types/tekton';
import { getPipelineRunDataModel } from '../utils/pipeline-graph-utils';
import PipelineRunNode from './nodes/PipelineRunNode';
import { PipelineRunNodeType } from '../types/pipeline';

export interface TopologyVisualizationProps {
  /** PipelineRun data */
  pipelineRun?: PipelineRunKind;
  /** TaskRuns for detailed execution data */
  taskRuns?: TaskRunKind[];
  /** Width of the visualization */
  width?: number | string;
  /** Height of the visualization */
  height?: number | string;
  /** Custom CSS class name */
  className?: string;
  /** Error handler */
  onError?: (error: Error) => void;
}

const pipelineRunComponentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
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

const layoutFactory: LayoutFactory = (type: string, graph: any) => {
  // Use the same layout configuration as konflux-ui
  return new PipelineDagreLayout(graph, {
    nodesep: 50,
    ranksep: 100,
    ignoreGroups: true,
  } as DagreLayoutOptions);
};

// VisualizationFactory component (copied from konflux-ui pattern)
interface VisualizationFactoryProps {
  model: Model;
  layoutFactory: LayoutFactory;
  componentFactory: ComponentFactory;
  fullHeight?: boolean;
  children?: React.ReactElement;
}

const VisualizationFactory: React.FC<React.PropsWithChildren<VisualizationFactoryProps>> = ({
  model,
  layoutFactory,
  componentFactory,
  fullHeight = false,
  children,
}) => {
  const [controller, setController] = React.useState<Controller | null>(null);
  const [maxSize, setMaxSize] = React.useState<{ height: number; width: number } | null>(null);
  const layoutRef = React.useRef<string>();

  const onLayoutUpdate = React.useCallback(
    (nodes: Node[]) => {
      const maxX = Math.floor(
        nodes
          .map((node) => {
            const bounds = node.getBounds();
            return bounds.x + bounds.width;
          })
          .reduce((x1, x2) => Math.max(x1, x2), 0),
      );
      const maxY = Math.floor(
        nodes
          .map((node) => {
            const bounds = node.getBounds();
            return bounds.y + bounds.height + (node.isGroup() ? 25 : 0);
          })
          .reduce((y1, y2) => Math.max(y1, y2), 0),
      );

      const verticalMargin = 35;
      const horizontalMargin = 35;

      setMaxSize({
        height: Math.max(600, maxY + verticalMargin * 2),
        width: maxX + 35 + horizontalMargin * 2,
      });
    },
    [setMaxSize],
  );

  React.useEffect(() => {
    if (controller === null) {
      const visualization = new Visualization();
      visualization.registerLayoutFactory(layoutFactory);
      visualization.registerComponentFactory(componentFactory);
      visualization.setRenderConstraint(false);
      visualization.fromModel(model);
      visualization.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
        onLayoutUpdate(visualization.getGraph().getNodes());
      });
      setController(visualization);
    } else {
      controller.fromModel(model, model.graph?.layout === layoutRef.current);
      layoutRef.current = model.graph?.layout;
      controller.getGraph().layout();
    }
  }, [controller, model, onLayoutUpdate, layoutFactory, componentFactory]);

  if (!controller) return null;

  const visualization = (
    <VisualizationProvider controller={controller}>
      <TopologyView>
        <VisualizationSurface />
      </TopologyView>
      {children}
    </VisualizationProvider>
  );

  return fullHeight ? (
    visualization
  ) : (
    <div
      style={{ height: maxSize?.height, width: maxSize?.width }}
    >
      {visualization}
    </div>
  );
};

export const TopologyVisualization: React.FC<TopologyVisualizationProps> = ({
  pipelineRun,
  taskRuns = [],
  width = '100%',
  height = '600px',
  className,
  onError: _onError,
}) => {
  const model = React.useMemo(() => {
    if (!pipelineRun) return null;
    return getPipelineRunDataModel(pipelineRun, taskRuns);
  }, [pipelineRun, taskRuns]);

  if (!pipelineRun) {
    return (
      <div className={`topology-visualization-loading ${className || ''}`}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No pipeline run data provided</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className={`topology-visualization-loading ${className || ''}`}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading pipeline visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`topology-visualization ${className || ''}`}
      style={{ 
        width, 
        height, 
        background: '#f6f8fa', 
        borderRadius: 8, 
        border: '1px solid #e1e4e8',
        overflow: 'auto'
      }}
    >
      <VisualizationFactory
        componentFactory={pipelineRunComponentFactory}
        layoutFactory={layoutFactory}
        model={model}
      />
    </div>
  );
}; 