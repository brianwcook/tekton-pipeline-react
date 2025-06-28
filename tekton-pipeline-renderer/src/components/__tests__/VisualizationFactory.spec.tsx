import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisualizationFactory from '../VisualizationFactory';
import { Model, Controller, LayoutFactory, ComponentFactory } from '@patternfly/react-topology';

// Mock PatternFly topology classes
const mockController = {
  fromModel: jest.fn(),
  getGraph: jest.fn(() => ({
    getNodes: jest.fn(() => [
      { getBounds: () => ({ x: 0, y: 0, width: 100, height: 32 }), isGroup: () => false },
      { getBounds: () => ({ x: 150, y: 0, width: 120, height: 32 }), isGroup: () => false }
    ]),
    layout: jest.fn()
  }))
};

const mockVisualization = {
  registerLayoutFactory: jest.fn(),
  registerComponentFactory: jest.fn(),
  setRenderConstraint: jest.fn(),
  fromModel: jest.fn(),
  addEventListener: jest.fn((eventName, callback) => {
    // Immediately trigger layout end event to simulate layout completion
    if (eventName === 'graph-layout-end') {
      setTimeout(() => callback(), 0);
    }
  }),
  getGraph: jest.fn(() => ({
    getNodes: jest.fn(() => [
      { getBounds: () => ({ x: 0, y: 0, width: 100, height: 32 }), isGroup: () => false },
      { getBounds: () => ({ x: 150, y: 0, width: 120, height: 32 }), isGroup: () => false }
    ]),
    layout: jest.fn()
  }))
};

jest.mock('@patternfly/react-topology', () => ({
  Visualization: jest.fn().mockImplementation(() => mockVisualization),
  VisualizationProvider: ({ children }: any) => <div data-testid="visualization-provider">{children}</div>,
  TopologyView: ({ children, controlBar }: any) => (
    <div data-testid="topology-view">
      {controlBar && <div data-testid="control-bar">{controlBar}</div>}
      {children}
    </div>
  ),
  VisualizationSurface: () => <div data-testid="visualization-surface" />,
  GRAPH_LAYOUT_END_EVENT: 'graph-layout-end',
  ModelKind: { graph: 'graph' },
  DEFAULT_LAYERS: ['default'],
}));

const mockModel: Model = {
  graph: {
    id: 'test-graph',
    type: 'graph',
    layout: 'dagre',
    layers: ['default'],
    x: 0,
    y: 0
  },
  nodes: [
    {
      id: 'node1',
      type: 'task',
      label: 'Task 1',
      x: 0,
      y: 0,
      width: 100,
      height: 32
    },
    {
      id: 'node2', 
      type: 'task',
      label: 'Task 2',
      x: 150,
      y: 0,
      width: 120,
      height: 32
    }
  ],
  edges: [
    {
      id: 'edge1',
      type: 'edge',
      source: 'node1',
      target: 'node2'
    }
  ]
};

const mockLayoutFactory = jest.fn() as unknown as LayoutFactory;
const mockComponentFactory = jest.fn() as unknown as ComponentFactory;

describe('VisualizationFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Creation', () => {
    it('should create visualization controller with correct configuration', async () => {
      render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      await waitFor(() => {
        expect(mockVisualization.registerLayoutFactory).toHaveBeenCalledWith(mockLayoutFactory);
        expect(mockVisualization.registerComponentFactory).toHaveBeenCalledWith(mockComponentFactory);
        expect(mockVisualization.setRenderConstraint).toHaveBeenCalledWith(false);
        expect(mockVisualization.fromModel).toHaveBeenCalledWith(mockModel);
      });
    });

    it('should register layout end event listener', async () => {
      render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      await waitFor(() => {
        expect(mockVisualization.addEventListener).toHaveBeenCalledWith(
          'graph-layout-end',
          expect.any(Function)
        );
      });
    });
  });

  describe('Topology Rendering', () => {
    it('should render PatternFly topology components', () => {
      render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      expect(screen.getByTestId('visualization-provider')).toBeInTheDocument();
      expect(screen.getByTestId('topology-view')).toBeInTheDocument();
      expect(screen.getByTestId('visualization-surface')).toBeInTheDocument();
    });

    it('should calculate correct size based on node bounds', async () => {
      const { container } = render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      await waitFor(() => {
        const wrapper = container.querySelector('[data-test="visualization-wrapper"]');
        expect(wrapper).toBeInTheDocument();
        // Size should be calculated based on node bounds + margins
        // maxX = 150 + 120 = 270, maxY = 32
        // Width = 270 + 40 (drop shadow) + 70 (margins) = 380
        // Height = max(400, 32 + 70) = 400
        expect(wrapper).toHaveStyle('width: 380px');
        expect(wrapper).toHaveStyle('height: 400px');
      });
    });

    it('should use minimum graph height when nodes are small', async () => {
      const smallModel: Model = {
        ...mockModel,
        nodes: [
          {
            id: 'small-node',
            type: 'task',
            label: 'Small Task',
            x: 0,
            y: 0,
            width: 50,
            height: 20
          }
        ]
      };

      const { container } = render(
        <VisualizationFactory
          model={smallModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      await waitFor(() => {
        const wrapper = container.querySelector('[data-test="visualization-wrapper"]');
        expect(wrapper).toHaveStyle('height: 400px'); // MIN_GRAPH_HEIGHT
      });
    });
  });

  describe('Control Bar Integration', () => {
    it('should render control bar when provided', () => {
      const mockControlBar = (controller: Controller) => (
        <div data-testid="custom-control-bar">Control Bar</div>
      );

      render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
          controlBar={mockControlBar}
        />
      );

      expect(screen.getByTestId('control-bar')).toBeInTheDocument();
      expect(screen.getByTestId('custom-control-bar')).toBeInTheDocument();
    });

    it('should not render control bar when not provided', () => {
      render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      expect(screen.queryByTestId('control-bar')).not.toBeInTheDocument();
    });
  });

  describe('Full Height Mode', () => {
    it('should render without wrapper when fullHeight is true', () => {
      const { container } = render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
          fullHeight={true}
        />
      );

      expect(container.querySelector('[data-test="visualization-wrapper"]')).not.toBeInTheDocument();
      expect(screen.getByTestId('visualization-provider')).toBeInTheDocument();
    });

    it('should render with wrapper when fullHeight is false', () => {
      const { container } = render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
          fullHeight={false}
        />
      );

      expect(container.querySelector('[data-test="visualization-wrapper"]')).toBeInTheDocument();
      expect(screen.getByTestId('visualization-provider')).toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('should render children components', () => {
      render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        >
          <div data-testid="child-component">Child Content</div>
        </VisualizationFactory>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('Model Updates', () => {
    it('should handle model updates correctly', async () => {
      const { rerender } = render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

             const updatedModel: Model = {
         ...mockModel,
         nodes: [
           ...(mockModel.nodes || []),
           {
             id: 'node3',
             type: 'task',
             label: 'Task 3',
             x: 300,
             y: 0,
             width: 100,
             height: 32
           }
         ]
       };

      // Update the mock controller to return the updated model
      mockController.fromModel.mockClear();
      mockController.getGraph.mockReturnValue({
        getNodes: jest.fn(() => [
          { getBounds: () => ({ x: 0, y: 0, width: 100, height: 32 }), isGroup: () => false },
          { getBounds: () => ({ x: 150, y: 0, width: 120, height: 32 }), isGroup: () => false },
          { getBounds: () => ({ x: 300, y: 0, width: 100, height: 32 }), isGroup: () => false }
        ]),
        layout: jest.fn()
      });

      rerender(
        <VisualizationFactory
          model={updatedModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      await waitFor(() => {
        expect(mockVisualization.fromModel).toHaveBeenLastCalledWith(updatedModel, true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing model gracefully', () => {
      const emptyModel: Model = {
        graph: {
          id: 'empty-graph',
          type: 'graph',
          layout: 'dagre',
          layers: ['default'],
          x: 0,
          y: 0
        },
        nodes: [],
        edges: []
      };

      render(
        <VisualizationFactory
          model={emptyModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      expect(screen.getByTestId('visualization-provider')).toBeInTheDocument();
      expect(screen.getByTestId('topology-view')).toBeInTheDocument();
    });

    it('should handle visualization creation failure', () => {
      // Create a mock that throws error when fromModel is called
      const errorVisualization = {
        ...mockVisualization,
        fromModel: jest.fn(() => {
          throw new Error('Visualization creation failed');
        })
      };

      jest.mocked(require('@patternfly/react-topology').Visualization)
        .mockImplementationOnce(() => errorVisualization);

      // Capture console.error calls during this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      // Should render error UI instead of topology
      expect(screen.getByTestId('visualization-error')).toBeInTheDocument();
      expect(screen.getByText('Visualization Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to render topology visualization')).toBeInTheDocument();
      expect(screen.getByText('Visualization creation failed')).toBeInTheDocument();

      // Should not render normal topology components
      expect(screen.queryByTestId('visualization-provider')).not.toBeInTheDocument();
      expect(screen.queryByTestId('topology-view')).not.toBeInTheDocument();

      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create or update visualization:', expect.any(Error));

      // Restore mocks
      consoleSpy.mockRestore();
    });


  });

  describe('Memoization', () => {
    it('should memoize component to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      // Clear mocks to track new calls
      jest.clearAllMocks();

      // Re-render with same props
      rerender(
        <VisualizationFactory
          model={mockModel}
          layoutFactory={mockLayoutFactory}
          componentFactory={mockComponentFactory}
        />
      );

      // Should not create new visualization since props are the same
      expect(mockVisualization.registerLayoutFactory).not.toHaveBeenCalled();
      expect(mockVisualization.registerComponentFactory).not.toHaveBeenCalled();
    });
  });
}); 