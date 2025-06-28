import { ModelKind, PipelineNodeModel, EdgeModel, GraphModel, DEFAULT_LAYERS } from '@patternfly/react-topology';
import { 
  TektonPipelineRunKind, 
  TektonTaskRunKind, 
  TektonPipelineKind, 
  TektonPipelineTask 
} from '../types/tekton';
import { 
  PipelineRunNodeData, 
  PipelineRunNodeType, 
  PipelineRunTaskWithStatus, 
  runStatus 
} from '../types/pipeline-run';
import { PipelineLayout } from '../factories/layoutFactory';

const DEFAULT_NODE_HEIGHT = 32;

export const getPipelineFromPipelineRun = (pipelineRun: TektonPipelineRunKind): TektonPipelineKind | null => {
  const PIPELINE_LABEL = 'tekton.dev/pipeline';
  const pipelineName =
    pipelineRun?.metadata?.labels?.[PIPELINE_LABEL] || pipelineRun?.metadata?.name;
  const pipelineSpec = pipelineRun?.status?.pipelineSpec || pipelineRun?.spec?.pipelineSpec;

  if (!pipelineName || !pipelineSpec) {
    return null;
  }
  return {
    apiVersion: pipelineRun.apiVersion,
    kind: 'Pipeline',
    metadata: {
      name: pipelineName,
      namespace: pipelineRun.metadata.namespace,
    },
    spec: pipelineSpec,
  };
};

const getTaskRunStatus = (taskName: string, taskRuns: TektonTaskRunKind[]): runStatus => {
  const taskRun = taskRuns.find(tr => 
    tr.metadata.labels?.['tekton.dev/pipelineTask'] === taskName
  );
  
  if (!taskRun?.status?.conditions) {
    return runStatus.Pending;
  }

  const condition = taskRun.status.conditions.find(c => c.type === 'Succeeded');
  if (!condition) {
    return runStatus.Pending;
  }

  switch (condition.status.toLowerCase()) {
    case 'true':
      return runStatus.Succeeded;
    case 'false':
      return runStatus.Failed;
    default:
      return condition.reason === 'Running' ? runStatus.Running : runStatus.Pending;
  }
};

const appendStatus = (
  pipeline: TektonPipelineKind,
  pipelineRun?: TektonPipelineRunKind,
  taskRuns: TektonTaskRunKind[] = [],
  isFinallyTasks = false,
): PipelineRunTaskWithStatus[] => {
  const tasks = isFinallyTasks ? pipeline.spec.finally || [] : pipeline.spec.tasks;
  
  return tasks.map((task: TektonPipelineTask) => {
    const taskStatus = getTaskRunStatus(task.name, taskRuns);
    
    return {
      ...task,
      status: {
        reason: taskStatus,
        conditions: [],
      },
    };
  });
};

const getLabelWidth = (label: string, font: string = '0.875rem RedHatText'): number => {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font;
      return Math.ceil(context.measureText(label).width) + 40; // padding
    }
  }
  return label.length * 8 + 40; // fallback
};

const getNodeLevel = (
  node: PipelineNodeModel & { runAfterTasks?: string[] },
  allNodes: (PipelineNodeModel & { runAfterTasks?: string[] })[],
): number => {
  if (!node.runAfterTasks?.length) {
    return 0;
  }
  
  const maxParentLevel = node.runAfterTasks.reduce((max, taskName) => {
    const parentNode = allNodes.find(n => n.id === taskName);
    if (parentNode) {
      const parentLevel = parentNode.data?.level ?? getNodeLevel(parentNode, allNodes);
      return Math.max(max, parentLevel);
    }
    return max;
  }, -1);
  
  return maxParentLevel + 1;
};

const getGraphDataModel = (
  pipeline: TektonPipelineKind,
  pipelineRun?: TektonPipelineRunKind,
  taskRuns: TektonTaskRunKind[] = [],
) => {
  const taskList = appendStatus(pipeline, pipelineRun, taskRuns);
  const finallyTaskList = appendStatus(pipeline, pipelineRun, taskRuns, true);
  const allTasks = [...taskList, ...finallyTaskList];

  const nodes = allTasks.map((task) => {
    const runAfterTasks = [...(task.runAfter || [])];
    
    const nodeData: PipelineRunNodeData = {
      namespace: pipelineRun?.metadata?.namespace || '',
      status: task.status?.reason,
      task,
      taskRun: taskRuns.find(
        (tr) => tr.metadata.labels?.['tekton.dev/pipelineTask'] === task.name,
      ),
    };

    return {
      id: task.name,
      type: PipelineRunNodeType.TASK_NODE,
      label: task.name,
      runAfterTasks,
      height: DEFAULT_NODE_HEIGHT,
      width: getLabelWidth(task.name),
      data: nodeData,
    };
  });

  // Set the level and width of each node
  nodes.forEach((taskNode: any) => {
    taskNode.data.level = getNodeLevel(taskNode, nodes);
  });

  // Set the width of nodes to the max width for its level
  nodes.forEach((taskNode: any) => {
    const levelNodes = nodes.filter((n: any) => n.data.level === taskNode.data.level);
    taskNode.width = levelNodes.reduce((maxWidth: number, n: any) => Math.max(n.width, maxWidth), 0);
  });

  // Create edges between connected tasks
  const edges: EdgeModel[] = [];
  nodes.forEach((node: any) => {
    if (node.runAfterTasks?.length) {
      node.runAfterTasks.forEach((parentTaskName: string) => {
        edges.push({
          id: `${parentTaskName}-${node.id}`,
          type: PipelineRunNodeType.EDGE,
          source: parentTaskName,
          target: node.id,
        });
      });
    }
  });

  return {
    graph: {
      id: 'pipelinerun-vis-graph',
      type: ModelKind.graph,
      layout: PipelineLayout.PIPELINERUN_VISUALIZATION,
      layers: DEFAULT_LAYERS,
      y: 40,
      x: 15,
    } as GraphModel,
    nodes,
    edges,
  };
};

export const getPipelineRunDataModel = (pipelineRun: TektonPipelineRunKind, taskRuns: TektonTaskRunKind[] = []) => {
  const pipeline = getPipelineFromPipelineRun(pipelineRun);
  if (!pipeline) {
    return null;
  }
  return getGraphDataModel(pipeline, pipelineRun, taskRuns);
}; 