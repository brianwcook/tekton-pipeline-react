import { renderHook } from '@testing-library/react';
import { usePipelineRunData } from '../usePipelineRunData';
import { PipelineRunKind, TaskRunKind } from '../../types';

describe('usePipelineRunData', () => {
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
      pipelineResults: [
        {
          name: 'result1',
          value: 'value1',
        },
      ],
    },
  };

  const mockTaskRuns: TaskRunKind[] = [
    {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'TaskRun',
      metadata: {
        name: 'test-pipeline-run-task1',
      },
      spec: {
        taskRef: { name: 'task1' },
      },
      status: {
        conditions: [
          {
            type: 'Succeeded',
            status: 'True',
          },
        ],
        startTime: '2023-01-01T00:00:00Z',
        completionTime: '2023-01-01T00:02:00Z',
        steps: [
          {
            name: 'step1',
            terminated: {
              exitCode: 0,
              reason: 'Completed',
              startedAt: '2023-01-01T00:00:00Z',
              finishedAt: '2023-01-01T00:02:00Z',
            },
          },
        ],
        taskResults: [
          {
            name: 'task-result1',
            type: 'string',
            value: 'task-value1',
          },
        ],
      },
    },
    {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'TaskRun',
      metadata: {
        name: 'test-pipeline-run-task2',
      },
      spec: {
        taskRef: { name: 'task2' },
      },
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
        steps: [
          {
            name: 'step1',
            terminated: {
              exitCode: 1,
              reason: 'Error',
              startedAt: '2023-01-01T00:02:00Z',
              finishedAt: '2023-01-01T00:05:00Z',
            },
          },
        ],
      },
    },
  ];

  it('should return empty data when no pipeline run is provided', () => {
    const { result } = renderHook(() => usePipelineRunData(null));

    expect(result.current).toEqual({
      pipelineRun: null,
      taskRuns: [],
      status: 'Unknown',
      tasks: [],
    });
  });

  it('should process pipeline run without task runs', () => {
    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun));

    expect(result.current.pipelineRun).toBe(mockPipelineRun);
    expect(result.current.taskRuns).toEqual([]);
    expect(result.current.status).toBe('Succeeded');
    expect(result.current.startTime).toBe('2023-01-01T00:00:00Z');
    expect(result.current.endTime).toBe('2023-01-01T00:05:00Z');
    expect(result.current.duration).toBe('300000'); // 5 minutes in milliseconds
    expect(result.current.results).toEqual([
      {
        name: 'result1',
        value: 'value1',
      },
    ]);
  });

  it('should process pipeline run with task runs', () => {
    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun, mockTaskRuns));

    expect(result.current.pipelineRun).toBe(mockPipelineRun);
    expect(result.current.taskRuns).toBe(mockTaskRuns);
    expect(result.current.status).toBe('Succeeded');
    expect(result.current.tasks).toHaveLength(2);

    // Check task1
    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.status).toBe('Succeeded');
    expect(task1?.status.startTime).toBe('2023-01-01T00:00:00Z');
    expect(task1?.status.endTime).toBe('2023-01-01T00:02:00Z');
    expect(task1?.status.duration).toBe('120000'); // 2 minutes in milliseconds

    // Check task2
    const task2 = result.current.tasks.find(t => t.name === 'task2');
    expect(task2?.status.status).toBe('Failed');
    expect(task2?.status.startTime).toBe('2023-01-01T00:02:00Z');
    expect(task2?.status.endTime).toBe('2023-01-01T00:05:00Z');
    expect(task2?.status.duration).toBe('180000'); // 3 minutes in milliseconds
  });

  it('should handle running pipeline run', () => {
    const runningPipelineRun: PipelineRunKind = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        conditions: [
          {
            type: 'Succeeded',
            status: 'Unknown',
          },
        ],
        completionTime: undefined,
      },
    };

    const { result } = renderHook(() => usePipelineRunData(runningPipelineRun));

    expect(result.current.status).toBe('Running');
    expect(result.current.endTime).toBeUndefined();
    expect(result.current.duration).toBeUndefined();
  });

  it('should handle failed pipeline run', () => {
    const failedPipelineRun: PipelineRunKind = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        conditions: [
          {
            type: 'Succeeded',
            status: 'False',
            reason: 'Failed',
          },
        ],
      },
    };

    const { result } = renderHook(() => usePipelineRunData(failedPipelineRun));

    expect(result.current.status).toBe('Failed');
  });

  it('should handle cancelled pipeline run', () => {
    const cancelledPipelineRun: PipelineRunKind = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        conditions: [
          {
            type: 'Succeeded',
            status: 'False',
            reason: 'Cancelled',
          },
        ],
      },
    };

    const { result } = renderHook(() => usePipelineRunData(cancelledPipelineRun));

    expect(result.current.status).toBe('Cancelled');
  });

  it('should handle tasks with detailed step information', () => {
    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun, mockTaskRuns));

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.steps).toHaveLength(1);
    expect(task1?.status.steps?.[0].name).toBe('step1');
    expect(task1?.status.steps?.[0].status).toBe('Succeeded');
    expect(task1?.status.steps?.[0].exitCode).toBe(0);
    expect(task1?.status.steps?.[0].reason).toBe('Completed');
    expect(task1?.status.steps?.[0].duration).toBe('120000');

    const task2 = result.current.tasks.find(t => t.name === 'task2');
    expect(task2?.status.steps).toHaveLength(1);
    expect(task2?.status.steps?.[0].name).toBe('step1');
    expect(task2?.status.steps?.[0].status).toBe('Failed');
    expect(task2?.status.steps?.[0].exitCode).toBe(1);
    expect(task2?.status.steps?.[0].reason).toBe('Error');
  });

  it('should handle task results', () => {
    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun, mockTaskRuns));

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.results).toHaveLength(1);
    expect(task1?.status.results?.[0].name).toBe('task-result1');
    expect(task1?.status.results?.[0].value).toBe('task-value1');
  });

  it('should handle tasks with retries', () => {
    const taskRunWithRetries: TaskRunKind = {
      ...mockTaskRuns[0],
      status: {
        ...mockTaskRuns[0].status,
        retriesStatus: [
          {
            conditions: [{ type: 'Succeeded', status: 'False' }],
          },
        ],
      },
    };

    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun, [taskRunWithRetries]));

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.retries).toBe(1);
  });

  it('should handle running steps', () => {
    const taskRunWithRunningStep: TaskRunKind = {
      ...mockTaskRuns[0],
      status: {
        ...mockTaskRuns[0].status,
        steps: [
          {
            name: 'step1',
            running: {
              startedAt: '2023-01-01T00:00:00Z',
            },
          },
        ],
      },
    };

    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun, [taskRunWithRunningStep]));

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.steps?.[0].status).toBe('Running');
    expect(task1?.status.steps?.[0].startTime).toBe('2023-01-01T00:00:00Z');
  });

  it('should handle waiting steps', () => {
    const taskRunWithWaitingStep: TaskRunKind = {
      ...mockTaskRuns[0],
      status: {
        ...mockTaskRuns[0].status,
        steps: [
          {
            name: 'step1',
            waiting: {
              reason: 'PodInitializing',
              message: 'Pod is initializing',
            },
          },
        ],
      },
    };

    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun, [taskRunWithWaitingStep]));

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.steps?.[0].status).toBe('Pending');
    expect(task1?.status.steps?.[0].reason).toBe('PodInitializing');
    expect(task1?.status.steps?.[0].message).toBe('Pod is initializing');
  });

  it('should handle tasks without detailed task run', () => {
    const { result } = renderHook(() => usePipelineRunData(mockPipelineRun, []));

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.steps).toEqual([]);
    expect(task1?.status.results).toEqual([]);
    expect(task1?.status.retries).toBe(0);
  });

  it('should memoize results when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ pipelineRun, taskRuns }) => usePipelineRunData(pipelineRun, taskRuns),
      {
        initialProps: {
          pipelineRun: mockPipelineRun,
          taskRuns: mockTaskRuns,
        },
      }
    );

    const firstResult = result.current;

    // Rerender with same props
    rerender({
      pipelineRun: mockPipelineRun,
      taskRuns: mockTaskRuns,
    });

    expect(result.current).toBe(firstResult);

    // Rerender with different props
    const newPipelineRun = { ...mockPipelineRun, metadata: { name: 'new-pipeline-run' } };
    rerender({
      pipelineRun: newPipelineRun,
      taskRuns: mockTaskRuns,
    });

    expect(result.current).not.toBe(firstResult);
  });

  it('should handle pipeline run without status', () => {
    const pipelineRunWithoutStatus: PipelineRunKind = {
      ...mockPipelineRun,
      status: undefined,
    };

    const { result } = renderHook(() => usePipelineRunData(pipelineRunWithoutStatus));

    expect(result.current.status).toBe('Unknown');
    expect(result.current.startTime).toBeUndefined();
    expect(result.current.endTime).toBeUndefined();
    expect(result.current.duration).toBeUndefined();
    expect(result.current.tasks).toHaveLength(0);
  });
}); 