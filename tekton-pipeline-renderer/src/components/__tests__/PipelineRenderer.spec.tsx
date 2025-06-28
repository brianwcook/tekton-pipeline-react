import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { PipelineRenderer } from '../PipelineRenderer';
import { PipelineKind, PipelineRunKind, TaskRunKind } from '../../types';

// Mock the YAMLParser
jest.mock('../../utils/yaml-parser', () => ({
  YAMLParser: {
    parsePipeline: jest.fn(),
  },
}));

// Mock the usePipelineData hook
jest.mock('../../hooks/usePipelineData', () => ({
  usePipelineData: jest.fn(),
}));

import { YAMLParser } from '../../utils/yaml-parser';
import { usePipelineData } from '../../hooks/usePipelineData';

const mockYAMLParser = YAMLParser as jest.Mocked<typeof YAMLParser>;
const mockUsePipelineData = usePipelineData as jest.MockedFunction<typeof usePipelineData>;

describe('PipelineRenderer', () => {
  const mockPipeline: PipelineKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'Pipeline',
    metadata: {
      name: 'test-pipeline',
    },
    spec: {
      tasks: [
        {
          name: 'task1',
          taskRef: { name: 'task1' },
        },
        {
          name: 'task2',
          taskRef: { name: 'task2' },
        },
      ],
    },
  };

  const mockPipelineRun: PipelineRunKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'PipelineRun',
    metadata: {
      name: 'test-pipeline-run',
    },
    spec: {
      pipelineRef: { name: 'test-pipeline' },
    },
    status: {
      conditions: [
        {
          type: 'Succeeded',
          status: 'True',
        },
      ],
    },
  };

  const mockTaskRuns: TaskRunKind[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePipelineData.mockReturnValue({
      pipeline: mockPipeline,
      pipelineRun: mockPipelineRun,
      taskRuns: mockTaskRuns,
      tasks: [
        {
          name: 'task1',
          status: {
            name: 'task1',
            status: 'Succeeded',
            duration: '5000',
          },
          task: mockPipeline.spec.tasks[0],
        },
        {
          name: 'task2',
          status: {
            name: 'task2',
            status: 'Running',
          },
          task: mockPipeline.spec.tasks[1],
        },
      ],
    });
  });

  it('should render pipeline with object data', () => {
    render(
      <PipelineRenderer
        pipeline={mockPipeline}
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
      />
    );

    expect(screen.getByText('Pipeline: test-pipeline')).toBeInTheDocument();
    expect(screen.getByText('Tasks (2):')).toBeInTheDocument();
    expect(screen.getByText('task1 - Succeeded')).toBeInTheDocument();
    expect(screen.getByText('task2 - Running')).toBeInTheDocument();
  });

  it('should render pipeline with YAML data', () => {
    const yamlString = 'apiVersion: tekton.dev/v1beta1\nkind: Pipeline\nmetadata:\n  name: test-pipeline';
    
    mockYAMLParser.parsePipeline.mockReturnValue(mockPipeline);

    render(
      <PipelineRenderer
        yaml={yamlString}
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
      />
    );

    expect(mockYAMLParser.parsePipeline).toHaveBeenCalledWith(yamlString);
    expect(screen.getByText('Pipeline: test-pipeline')).toBeInTheDocument();
  });

  it('should show error when YAML parsing fails', () => {
    const yamlString = 'invalid yaml';
    const error = new Error('Invalid YAML');
    
    mockYAMLParser.parsePipeline.mockImplementation(() => {
      throw error;
    });

    const onError = jest.fn();

    render(
      <PipelineRenderer
        yaml={yamlString}
        onError={onError}
      />
    );

    expect(screen.getByText('Error Loading Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Invalid YAML')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should show loading state when no data provided', () => {
    render(<PipelineRenderer />);

    expect(screen.getByText('No pipeline data provided')).toBeInTheDocument();
  });

  it('should render with custom dimensions', () => {
    render(
      <PipelineRenderer
        pipeline={mockPipeline}
        width={800}
        height={400}
      />
    );

    const container = screen.getByText('Pipeline: test-pipeline').closest('.pipeline-renderer');
    expect(container).toHaveStyle({ width: '800px', height: '400px' });
  });

  it('should render with custom CSS class', () => {
    render(
      <PipelineRenderer
        pipeline={mockPipeline}
        className="custom-class"
      />
    );

    const container = screen.getByText('Pipeline: test-pipeline').closest('.pipeline-renderer');
    expect(container).toHaveClass('custom-class');
  });

  it('should show task duration when showTaskDetails is true', () => {
    render(
      <PipelineRenderer
        pipeline={mockPipeline}
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
        showTaskDetails={true}
      />
    );

    expect(screen.getByText('(Duration: 5s)')).toBeInTheDocument();
  });

  it('should not show task duration when showTaskDetails is false', () => {
    render(
      <PipelineRenderer
        pipeline={mockPipeline}
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
        showTaskDetails={false}
      />
    );

    expect(screen.queryByText('(Duration: 5s)')).not.toBeInTheDocument();
  });

  it('should prioritize pipeline object over YAML', () => {
    const yamlString = 'apiVersion: tekton.dev/v1beta1\nkind: Pipeline\nmetadata:\n  name: yaml-pipeline';
    
    render(
      <PipelineRenderer
        yaml={yamlString}
        pipeline={mockPipeline}
      />
    );

    expect(mockYAMLParser.parsePipeline).not.toHaveBeenCalled();
    expect(screen.getByText('Pipeline: test-pipeline')).toBeInTheDocument();
  });
}); 