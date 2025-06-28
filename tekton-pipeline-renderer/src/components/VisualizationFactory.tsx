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
} from '@patternfly/react-topology';

const DROP_SHADOW_SPACING = 40;
const MIN_GRAPH_HEIGHT = 400;

type VisualizationFactoryProps = {
  model: Model;
  layoutFactory: LayoutFactory;
  componentFactory: ComponentFactory;
  controlBar?: (controller: Controller) => React.ReactNode;
  fullHeight?: boolean;
  children?: React.ReactElement;
};

type Size = {
  height: number;
  width: number;
};

const VisualizationFactory: React.FC<React.PropsWithChildren<VisualizationFactoryProps>> = ({
  model,
  layoutFactory,
  componentFactory,
  controlBar,
  fullHeight = false,
  children,
}) => {
  const [controller, setController] = React.useState<Controller | null>(null);
  const [maxSize, setMaxSize] = React.useState<Size | null>(null);
  const [error, setError] = React.useState<string | null>(null);
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
        height: Math.max(MIN_GRAPH_HEIGHT, maxY + verticalMargin * 2),
        width: maxX + DROP_SHADOW_SPACING + horizontalMargin * 2,
      });
    },
    [setMaxSize],
  );

  React.useEffect(() => {
    try {
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
        setError(null); // Clear any previous errors
      } else {
        controller.fromModel(model, model.graph?.layout === layoutRef.current);
        layoutRef.current = model.graph?.layout;
        controller.getGraph().layout();
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      console.error('Failed to create or update visualization:', err);
      setError(err instanceof Error ? err.message : 'Unknown visualization error');
      setController(null);
    }
  }, [controller, model, onLayoutUpdate, layoutFactory, componentFactory]);

  // Error state UI
  if (error) {
    return (
      <div 
        data-testid="visualization-error"
        style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#d73a49',
          border: '1px solid #d73a49',
          borderRadius: '4px',
          backgroundColor: '#ffeaea'
        }}
      >
        <h3>Visualization Error</h3>
        <p>Failed to render topology visualization</p>
        <details style={{ marginTop: '10px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>Error Details</summary>
          <code style={{ fontSize: '12px', color: '#666' }}>{error}</code>
        </details>
      </div>
    );
  }

  if (!controller) return null;

  const visualization = (
    <VisualizationProvider controller={controller} data-testid="visualization-provider">
      <TopologyView controlBar={controlBar ? controlBar(controller) : undefined} data-testid="topology-view">
        <VisualizationSurface data-testid="visualization-surface" />
      </TopologyView>
      {children}
    </VisualizationProvider>
  );

  return fullHeight ? (
    visualization
  ) : (
    <div
      data-test="visualization-wrapper"
      style={{ height: maxSize?.height, width: maxSize?.width }}
    >
      {visualization}
    </div>
  );
};

export default React.memo(VisualizationFactory); 