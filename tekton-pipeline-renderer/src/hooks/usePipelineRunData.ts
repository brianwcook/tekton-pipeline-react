import { useMemo } from 'react';
import { PipelineRunKind, TaskRunKind, RunStatus, PipelineRunData } from '../types';

export const usePipelineRunData = (
  pipelineRun: PipelineRunKind | null,
  taskRuns: TaskRunKind[] = []
): PipelineRunData => {
  return useMemo(() => {
    if (!pipelineRun) {
      return {
        pipelineRun: null,
        taskRuns: [],
        status: 'Unknown',
        tasks: [],
      };
    }

    // Calculate pipeline run status
    let status: RunStatus = 'Unknown';
    const condition = pipelineRun.status?.conditions?.find(c => c.type === 'Succeeded');
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

    // Calculate duration
    let duration: number | undefined;
    const startTime = pipelineRun.status?.startTime;
    const endTime = pipelineRun.status?.completionTime;
    
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      duration = end - start;
    }

    // Process tasks from taskRuns
    const tasks = Object.entries(pipelineRun.status?.taskRuns || {}).map(([taskRunName, taskRun]) => {
      const detailedTaskRun = taskRuns.find(tr => tr.metadata.name === taskRunName);
      
      let taskStatus: RunStatus = 'Unknown';
      const taskCondition = taskRun.status?.conditions?.find(c => c.type === 'Succeeded');
      if (taskCondition) {
        switch (taskCondition.status) {
          case 'True':
            taskStatus = 'Succeeded';
            break;
          case 'False':
            taskStatus = taskCondition.reason === 'Cancelled' ? 'Cancelled' : 'Failed';
            break;
          case 'Unknown':
            taskStatus = 'Running';
            break;
        }
      }

      let taskDuration: number | undefined;
      const taskStartTime = taskRun.status?.startTime;
      const taskEndTime = taskRun.status?.completionTime;
      
      if (taskStartTime && taskEndTime) {
        const start = new Date(taskStartTime).getTime();
        const end = new Date(taskEndTime).getTime();
        taskDuration = end - start;
      }

      return {
        name: taskRun.pipelineTaskName,
        status: {
          name: taskRun.pipelineTaskName,
          status: taskStatus,
          startTime: taskStartTime,
          endTime: taskEndTime,
          duration: taskDuration?.toString(),
          steps: detailedTaskRun?.status?.steps?.map(step => ({
            name: step.name,
            status: (step.running ? 'Running' : 
                   step.terminated ? (step.terminated.exitCode === 0 ? 'Succeeded' : 'Failed') : 
                   step.waiting ? 'Pending' : 'Unknown') as RunStatus,
            startTime: step.running?.startedAt || step.terminated?.startedAt,
            endTime: step.terminated?.finishedAt,
            duration: step.terminated?.startedAt && step.terminated?.finishedAt ? 
              (new Date(step.terminated.finishedAt).getTime() - new Date(step.terminated.startedAt).getTime()).toString() : undefined,
            exitCode: step.terminated?.exitCode,
            reason: step.terminated?.reason || step.waiting?.reason,
            message: step.terminated?.message || step.waiting?.message,
          })) || [],
          results: detailedTaskRun?.status?.taskResults?.map(result => ({
            name: result.name,
            value: result.value,
          })) || [],
          retries: detailedTaskRun?.status?.retriesStatus?.length || 0,
          reason: taskCondition?.reason,
          message: taskCondition?.message,
        },
        task: { name: taskRun.pipelineTaskName }, // Simplified task reference
      };
    });

    return {
      pipelineRun,
      taskRuns,
      status,
      startTime,
      endTime,
      duration: duration?.toString(),
      tasks,
      results: pipelineRun.status?.pipelineResults,
    };
  }, [pipelineRun, taskRuns]);
}; 