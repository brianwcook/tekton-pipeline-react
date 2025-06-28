import { useMemo } from 'react';
import { PipelineKind, PipelineRunKind, TaskRunKind, RunStatus, PipelineTaskWithStatus } from '../types';

export interface PipelineData {
  pipeline: PipelineKind | null;
  pipelineRun: PipelineRunKind | null;
  taskRuns: TaskRunKind[];
  tasks: PipelineTaskWithStatus[];
}

export const usePipelineData = (
  pipeline: PipelineKind | null,
  pipelineRun?: PipelineRunKind | null,
  taskRuns: TaskRunKind[] = []
): PipelineData => {
  return useMemo(() => {
    if (!pipeline) {
      return {
        pipeline: null,
        pipelineRun: null,
        taskRuns: [],
        tasks: [],
      };
    }

    const tasks: PipelineTaskWithStatus[] = pipeline.spec.tasks.map((task) => {
      const taskRun = pipelineRun?.status?.taskRuns?.[`${pipelineRun.metadata.name}-${task.name}`];
      const detailedTaskRun = taskRuns.find(tr => tr.metadata.name === taskRun?.pipelineTaskName);

      let status: RunStatus = 'Unknown';
      let startTime: string | undefined;
      let endTime: string | undefined;
      let duration: number | undefined;

      if (taskRun?.status) {
        const condition = taskRun.status.conditions?.find(c => c.type === 'Succeeded');
        if (condition) {
          switch (condition.status) {
            case 'True':
              status = 'Succeeded';
              break;
            case 'False':
              status = condition.reason === 'Cancelled' ? 'Cancelled' : 'Failed';
              break;
            case 'Unknown':
              status = 'Running';
              break;
          }
        }

        startTime = taskRun.status.startTime;
        endTime = taskRun.status.completionTime;

        if (startTime && endTime) {
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          duration = end - start;
        }
      } else if (pipelineRun?.status?.skippedTasks?.some(st => st.name === task.name)) {
        status = 'Skipped';
      } else if (pipelineRun) {
        status = 'Pending';
      }

      return {
        name: task.name,
        status: {
          name: task.name,
          status,
          startTime,
          endTime,
          duration: duration?.toString(),
          steps: detailedTaskRun?.status?.steps?.map(step => ({
            name: step.name,
            status: step.running ? 'Running' : 
                   step.terminated ? (step.terminated.exitCode === 0 ? 'Succeeded' : 'Failed') : 
                   step.waiting ? 'Pending' : 'Unknown',
            startTime: step.running?.startedAt || step.terminated?.startedAt,
            endTime: step.terminated?.finishedAt,
            exitCode: step.terminated?.exitCode,
            reason: step.terminated?.reason || step.waiting?.reason,
            message: step.terminated?.message || step.waiting?.message,
          })) || [],
          results: detailedTaskRun?.status?.taskResults?.map(result => ({
            name: result.name,
            value: result.value,
          })) || [],
          retries: detailedTaskRun?.status?.retriesStatus?.length || 0,
          reason: taskRun?.status?.conditions?.find(c => c.type === 'Succeeded')?.reason,
          message: taskRun?.status?.conditions?.find(c => c.type === 'Succeeded')?.message,
        },
        task,
      };
    });

    return {
      pipeline,
      pipelineRun: pipelineRun || null,
      taskRuns,
      tasks,
    };
  }, [pipeline, pipelineRun, taskRuns]);
}; 