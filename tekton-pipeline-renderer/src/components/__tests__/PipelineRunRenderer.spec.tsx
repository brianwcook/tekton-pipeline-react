import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { PipelineRunRenderer } from '../PipelineRunRenderer';
import { PipelineRunKind, TaskRunKind } from '../../types';

// Mock the YAMLParser
jest.mock('../../utils/yaml-parser', () => ({
  YAMLParser: {
    parsePipelineRun: jest.fn(),
  },
}));

// Mock the usePipelineRunData hook
jest.mock('../../hooks/usePipelineRunData', () => ({
  usePipelineRunData: jest.fn(),
}));

import { YAMLParser } from '../../utils/yaml-parser';
import { usePipelineRunData } from '../../hooks/usePipelineRunData';

const mockYAMLParser = YAMLParser as jest.Mocked<typeof YAMLParser>;
const mockUsePipelineRunData = usePipelineRunData as jest.MockedFunction<typeof usePipelineRunData>;

describe('PipelineRunRenderer', () => {
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
      startTime: '2023-01-01T00:00:00Z',
      completionTime: '2023-01-01T00:05:00Z',
      taskRuns: {
        'test-pipeline-run-task1': {
          pipelineTaskName: 'task1',
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
              },
            ],
            startTime: '2023-01-01T00:00:00Z',
            completionTime: '2023-01-01T00:02:00Z',
          },
        },
        'test-pipeline-run-task2': {
          pipelineTaskName: 'task2',
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'False',
                reason: 'Failed',
              },
            ],
            startTime: '2023-01-01T00:02:00Z',
            completionTime: '2023-01-01T00:05:00Z',
          },
        },
      },
    },
  };

  const mockTaskRuns: TaskRunKind[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePipelineRunData.mockReturnValue({
      pipelineRun: mockPipelineRun,
      taskRuns: mockTaskRuns,
      status: 'Succeeded',
      startTime: '2023-01-01T00:00:00Z',
      endTime: '2023-01-01T00:05:00Z',
      duration: '300000',
      tasks: [
        {
          name: 'task1',
          status: {
            name: 'task1',
            status: 'Succeeded',
            startTime: '2023-01-01T00:00:00Z',
            endTime: '2023-01-01T00:02:00Z',
            duration: '120000',
            steps: [
              {
                name: 'step1',
                status: 'Succeeded',
                startTime: '2023-01-01T00:00:00Z',
                endTime: '2023-01-01T00:02:00Z',
                duration: '120000',
              },
            ],
          },
          task: { name: 'task1' },
        },
        {
          name: 'task2',
          status: {
            name: 'task2',
            status: 'Failed',
            startTime: '2023-01-01T00:02:00Z',
            endTime: '2023-01-01T00:05:00Z',
            duration: '180000',
            steps: [
              {
                name: 'step1',
                status: 'Failed',
                startTime: '2023-01-01T00:02:00Z',
                endTime: '2023-01-01T00:05:00Z',
                duration: '180000',
                exitCode: 1,
                reason: 'Error',
              },
            ],
          },
          task: { name: 'task2' },
        },
      ],
      results: [
        {
          name: 'result1',
          value: 'value1',
        },
      ],
    });
  });

  it('should render pipeline run with object data', () => {
    render(
      <PipelineRunRenderer
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
      />
    );

    expect(screen.getByText('Pipeline Run: test-pipeline-run')).toBeInTheDocument();
    const succeededElements = screen.getAllByText('Succeeded');
    expect(succeededElements[0]).toBeInTheDocument();
    expect(screen.getByText('Duration: 300s')).toBeInTheDocument();
    expect(screen.getByText('Tasks (2):')).toBeInTheDocument();
    expect(screen.getByText('task1')).toBeInTheDocument();
    expect(screen.getByText('task2')).toBeInTheDocument();
  });

  it('should render pipeline run with YAML data', () => {
    const yamlString = 'apiVersion: tekton.dev/v1beta1\nkind: PipelineRun\nmetadata:\n  name: test-pipeline-run';
    
    mockYAMLParser.parsePipelineRun.mockReturnValue(mockPipelineRun);

    render(
      <PipelineRunRenderer
        yaml={yamlString}
        taskRuns={mockTaskRuns}
      />
    );

    expect(mockYAMLParser.parsePipelineRun).toHaveBeenCalledWith(yamlString);
    expect(screen.getByText('Pipeline Run: test-pipeline-run')).toBeInTheDocument();
  });

  it('should show error when YAML parsing fails', () => {
    const yamlString = 'invalid yaml';
    const error = new Error('Invalid YAML');
    
    mockYAMLParser.parsePipelineRun.mockImplementation(() => {
      throw error;
    });

    const onError = jest.fn();

    render(
      <PipelineRunRenderer
        yaml={yamlString}
        onError={onError}
      />
    );

    expect(screen.getByText('Error Loading Pipeline Run')).toBeInTheDocument();
    expect(screen.getByText('Invalid YAML')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should show loading state when no data provided', () => {
    render(<PipelineRunRenderer />);

    expect(screen.getByText('No pipeline run data provided')).toBeInTheDocument();
  });

  it('should render with custom dimensions', () => {
    render(
      <PipelineRunRenderer
        pipelineRun={mockPipelineRun}
        width={800}
        height={400}
      />
    );

    const container = screen.getByText('Pipeline Run: test-pipeline-run').closest('.pipeline-run-renderer');
    expect(container).toHaveStyle({ width: '800px', height: '400px' });
  });

  it('should render with custom CSS class', () => {
    render(
      <PipelineRunRenderer
        pipelineRun={mockPipelineRun}
        className="custom-class"
      />
    );

    const container = screen.getByText('Pipeline Run: test-pipeline-run').closest('.pipeline-run-renderer');
    expect(container).toHaveClass('custom-class');
  });

  it('should show task details when showTaskDetails is true', () => {
    render(
      <PipelineRunRenderer
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
        showTaskDetails={true}
      />
    );

    expect(screen.getByText('Duration: 120s')).toBeInTheDocument();
    const stepsElements = screen.getAllByText('Steps:');
    expect(stepsElements[0]).toBeInTheDocument();
    expect(screen.getByText('step1 - Succeeded')).toBeInTheDocument();
  });

  it('should not show task details when showTaskDetails is false', () => {
    render(
      <PipelineRunRenderer
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
        showTaskDetails={false}
      />
    );

    expect(screen.queryByText('Duration: 120s')).not.toBeInTheDocument();
    expect(screen.queryByText('Steps:')).not.toBeInTheDocument();
  });

  it('should prioritize pipeline run object over YAML', () => {
    const yamlString = 'apiVersion: tekton.dev/v1beta1\nkind: PipelineRun\nmetadata:\n  name: yaml-pipeline-run';
    
    render(
      <PipelineRunRenderer
        yaml={yamlString}
        pipelineRun={mockPipelineRun}
      />
    );

    expect(mockYAMLParser.parsePipelineRun).not.toHaveBeenCalled();
    expect(screen.getByText('Pipeline Run: test-pipeline-run')).toBeInTheDocument();
  });

  it('should display correct status colors', () => {
    render(
      <PipelineRunRenderer
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
      />
    );

    const succeededElements = screen.getAllByText('Succeeded');
    const failedStatus = screen.getByText('Failed');

    expect(succeededElements[0]).toHaveStyle({ backgroundColor: '#28a745' });
    expect(failedStatus).toHaveStyle({ backgroundColor: '#d73a49' });
  });

  it('should handle different status types', () => {
    mockUsePipelineRunData.mockReturnValue({
      pipelineRun: mockPipelineRun,
      taskRuns: mockTaskRuns,
      status: 'Running',
      tasks: [
        {
          name: 'task1',
          status: {
            name: 'task1',
            status: 'Running',
          },
          task: { name: 'task1' },
        },
      ],
    });

    render(
      <PipelineRunRenderer
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
      />
    );

    const runningElements = screen.getAllByText('Running');
    expect(runningElements[0]).toHaveStyle({ backgroundColor: '#0366d6' });
  });
}); 