import { renderHook } from '@testing-library/react';
import { usePipelineData } from '../usePipelineData';
import { PipelineKind, PipelineRunKind, TaskRunKind } from '../../types';

describe('usePipelineData', () => {
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

  const mockTaskRuns: TaskRunKind[] = [
    {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'TaskRun',
      metadata: {
        name: 'task1',
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
            name: 'result1',
            type: 'string',
            value: 'value1',
          },
        ],
      },
    },
  ];

  it('should return empty data when no pipeline is provided', () => {
    const { result } = renderHook(() => usePipelineData(null));

    expect(result.current).toEqual({
      pipeline: null,
      pipelineRun: null,
      taskRuns: [],
      tasks: [],
    });
  });

  it('should process pipeline without pipeline run', () => {
    const { result } = renderHook(() => usePipelineData(mockPipeline));

    expect(result.current.pipeline).toBe(mockPipeline);
    expect(result.current.pipelineRun).toBeNull();
    expect(result.current.taskRuns).toEqual([]);
    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].name).toBe('task1');
    expect(result.current.tasks[1].name).toBe('task2');
  });

  it('should process pipeline with pipeline run', () => {
    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, mockPipelineRun, mockTaskRuns)
    );

    expect(result.current.pipeline).toBe(mockPipeline);
    expect(result.current.pipelineRun).toBe(mockPipelineRun);
    expect(result.current.taskRuns).toBe(mockTaskRuns);
    expect(result.current.tasks).toHaveLength(2);

    // Check task1 status
    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.status).toBe('Succeeded');
    expect(task1?.status.startTime).toBe('2023-01-01T00:00:00Z');
    expect(task1?.status.endTime).toBe('2023-01-01T00:02:00Z');
    expect(task1?.status.duration).toBe('120000'); // 2 minutes in milliseconds as string

    // Check task2 status
    const task2 = result.current.tasks.find(t => t.name === 'task2');
    expect(task2?.status.status).toBe('Failed');
    expect(task2?.status.startTime).toBe('2023-01-01T00:02:00Z');
    expect(task2?.status.endTime).toBe('2023-01-01T00:05:00Z');
    expect(task2?.status.duration).toBe('180000'); // 3 minutes in milliseconds as string
  });

  it('should handle skipped tasks', () => {
    const pipelineRunWithSkipped: PipelineRunKind = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        taskRuns: {
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
        skippedTasks: [
          {
            name: 'task1',
            reason: 'When expression evaluated to false',
            whenExpressions: [],
          },
        ],
      },
    };

    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, pipelineRunWithSkipped)
    );

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.status).toBe('Skipped');
  });

  it('should handle tasks with detailed step information', () => {
    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, mockPipelineRun, mockTaskRuns)
    );

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.steps).toHaveLength(1);
    expect(task1?.status.steps?.[0].name).toBe('step1');
    expect(task1?.status.steps?.[0].status).toBe('Succeeded');
    expect(task1?.status.steps?.[0].exitCode).toBe(0);
    expect(task1?.status.steps?.[0].reason).toBe('Completed');
  });

  it('should handle task results', () => {
    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, mockPipelineRun, mockTaskRuns)
    );

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.results).toHaveLength(1);
    expect(task1?.status.results?.[0].name).toBe('result1');
    expect(task1?.status.results?.[0].value).toBe('value1');
  });

  it('should handle running tasks', () => {
    const runningPipelineRun: PipelineRunKind = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        taskRuns: {
          'test-pipeline-run-task1': {
            pipelineTaskName: 'task1',
            status: {
              conditions: [
                {
                  type: 'Succeeded',
                  status: 'Unknown',
                },
              ],
              startTime: '2023-01-01T00:00:00Z',
            },
          },
        },
      },
    };

    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, runningPipelineRun)
    );

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.status).toBe('Running');
  });

  it('should handle cancelled tasks', () => {
    const cancelledPipelineRun: PipelineRunKind = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        taskRuns: {
          'test-pipeline-run-task1': {
            pipelineTaskName: 'task1',
            status: {
              conditions: [
                {
                  type: 'Succeeded',
                  status: 'False',
                  reason: 'Cancelled',
                },
              ],
            },
          },
        },
      },
    };

    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, cancelledPipelineRun)
    );

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.status).toBe('Cancelled');
  });

  it('should handle tasks with retries', () => {
    const taskRunWithRetries: TaskRunKind = {
      ...mockTaskRuns[0],
      metadata: {
        name: 'task1',
      },
      status: {
        ...mockTaskRuns[0].status,
        retriesStatus: [
          {
            conditions: [{ type: 'Succeeded', status: 'False' }],
          },
        ],
      },
    };

    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, mockPipelineRun, [taskRunWithRetries])
    );

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.retries).toBe(1);
  });

  it('should handle tasks without task run status', () => {
    const pipelineRunWithoutTaskRuns: PipelineRunKind = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        taskRuns: {},
      },
    };

    const { result } = renderHook(() => 
      usePipelineData(mockPipeline, pipelineRunWithoutTaskRuns)
    );

    const task1 = result.current.tasks.find(t => t.name === 'task1');
    expect(task1?.status.status).toBe('Pending');
  });

  it('should memoize results when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ pipeline, pipelineRun, taskRuns }) => usePipelineData(pipeline, pipelineRun, taskRuns),
      {
        initialProps: {
          pipeline: mockPipeline,
          pipelineRun: mockPipelineRun,
          taskRuns: mockTaskRuns,
        },
      }
    );

    const firstResult = result.current;

    // Rerender with same props
    rerender({
      pipeline: mockPipeline,
      pipelineRun: mockPipelineRun,
      taskRuns: mockTaskRuns,
    });

    expect(result.current).toBe(firstResult);

    // Rerender with different props
    const newPipelineRun = { ...mockPipelineRun, metadata: { name: 'new-pipeline-run' } };
    rerender({
      pipeline: mockPipeline,
      pipelineRun: newPipelineRun,
      taskRuns: mockTaskRuns,
    });

    expect(result.current).not.toBe(firstResult);
  });
}); 