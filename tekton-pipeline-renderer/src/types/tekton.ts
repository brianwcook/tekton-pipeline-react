export interface TektonCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface TektonMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  uid?: string;
  resourceVersion?: string;
  generation?: number;
  creationTimestamp?: string;
  deletionTimestamp?: string;
}

export interface TektonTaskRef {
  name: string;
  kind?: string;
  apiVersion?: string;
}

export interface TektonParam {
  name: string;
  value: string;
  type?: string;
}

export interface TektonWorkspace {
  name: string;
  workspace?: string;
  subPath?: string;
}

export interface TektonVolumeMount {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
}

export interface TektonEnvVar {
  name: string;
  value?: string;
  valueFrom?: {
    fieldRef?: {
      fieldPath: string;
    };
    secretKeyRef?: {
      name: string;
      key: string;
    };
    configMapKeyRef?: {
      name: string;
      key: string;
    };
  };
}

export interface TektonStep {
  name: string;
  image?: string;
  command?: string[];
  args?: string[];
  script?: string;
  env?: TektonEnvVar[];
  volumeMounts?: TektonVolumeMount[];
  workingDir?: string;
  resources?: {
    limits?: Record<string, string>;
    requests?: Record<string, string>;
  };
  securityContext?: {
    runAsUser?: number;
    runAsGroup?: number;
    fsGroup?: number;
    privileged?: boolean;
  };
}

export interface TektonTaskSpec {
  description?: string;
  params?: TektonParam[];
  results?: Array<{
    name: string;
    description?: string;
    type?: string;
  }>;
  steps: TektonStep[];
  volumes?: Array<{
    name: string;
    emptyDir?: Record<string, never>;
    configMap?: {
      name: string;
    };
    secret?: {
      secretName: string;
    };
  }>;
  workspaces?: Array<{
    name: string;
    description?: string;
    readOnly?: boolean;
    optional?: boolean;
  }>;
  stepTemplate?: TektonStep;
}

export interface TektonPipelineTask {
  name: string;
  taskRef?: TektonTaskRef;
  taskSpec?: TektonTaskSpec;
  params?: TektonParam[];
  workspaces?: TektonWorkspace[];
  runAfter?: string[];
  when?: Array<{
    input: string;
    operator: string;
    values: string[];
  }>;
  timeout?: string;
  retries?: number;
  conditions?: Array<{
    conditionRef: string;
    params?: TektonParam[];
  }>;
}

export interface TektonPipelineSpec {
  description?: string;
  params?: TektonParam[];
  resources?: Array<{
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
  }>;
  workspaces?: Array<{
    name: string;
    description?: string;
    optional?: boolean;
  }>;
  results?: Array<{
    name: string;
    description?: string;
    value: string;
  }>;
  tasks: TektonPipelineTask[];
  finally?: TektonPipelineTask[];
}

export interface TektonPipelineKind {
  apiVersion: string;
  kind: 'Pipeline';
  metadata: TektonMetadata;
  spec: TektonPipelineSpec;
}

export interface TektonPipelineRunSpec {
  pipelineRef?: {
    name: string;
    apiVersion?: string;
  };
  pipelineSpec?: TektonPipelineSpec;
  params?: TektonParam[];
  resources?: Array<{
    name: string;
    resourceRef?: {
      name: string;
    };
    resourceSpec?: unknown;
  }>;
  workspaces?: Array<{
    name: string;
    workspace?: string;
    subPath?: string;
    volumeClaimTemplate?: unknown;
    persistentVolumeClaim?: unknown;
    emptyDir?: unknown;
    configMap?: unknown;
    secret?: unknown;
  }>;
  serviceAccountName?: string;
  timeout?: string;
  podTemplate?: {
    nodeSelector?: Record<string, string>;
    tolerations?: unknown[];
    affinity?: unknown;
    securityContext?: unknown;
    volumes?: unknown[];
  };
  taskRunSpecs?: Array<{
    pipelineTaskName: string;
    taskServiceAccountName?: string;
    taskPodTemplate?: unknown;
  }>;
}

export interface TektonPipelineRunStatus {
  conditions?: TektonCondition[];
  startTime?: string;
  completionTime?: string;
  pipelineSpec?: TektonPipelineSpec;
  taskRuns?: Record<string, {
    pipelineTaskName: string;
    status?: TektonTaskRunStatus;
  }>;
  runs?: Record<string, unknown>;
  pipelineResults?: Array<{
    name: string;
    value: string;
  }>;
  skippedTasks?: Array<{
    name: string;
    reason: string;
    whenExpressions?: unknown[];
  }>;
  childReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    pipelineTaskName: string;
  }>;
}

export interface TektonPipelineRunKind {
  apiVersion: string;
  kind: 'PipelineRun';
  metadata: TektonMetadata;
  spec: TektonPipelineRunSpec;
  status?: TektonPipelineRunStatus;
}

export interface TektonTaskRunSpec {
  taskRef?: TektonTaskRef;
  taskSpec?: TektonTaskSpec;
  params?: TektonParam[];
  workspaces?: Array<{
    name: string;
    workspace?: string;
    subPath?: string;
  }>;
  serviceAccountName?: string;
  timeout?: string;
  podTemplate?: {
    nodeSelector?: Record<string, string>;
    tolerations?: unknown[];
    affinity?: unknown;
    securityContext?: unknown;
    volumes?: unknown[];
  };
}

export interface TektonTaskRunStatus {
  conditions?: TektonCondition[];
  startTime?: string;
  completionTime?: string;
  steps?: Array<{
    name: string;
    container?: string;
    imageID?: string;
    running?: {
      startedAt: string;
    };
    terminated?: {
      exitCode: number;
      reason: string;
      startedAt: string;
      finishedAt: string;
      message?: string;
    };
    waiting?: {
      reason: string;
      message?: string;
    };
  }>;
  taskResults?: Array<{
    name: string;
    type: string;
    value: string;
  }>;
  retriesStatus?: TektonTaskRunStatus[];
  sidecars?: Array<{
    name: string;
    container?: string;
    imageID?: string;
    running?: {
      startedAt: string;
    };
    terminated?: {
      exitCode: number;
      reason: string;
      startedAt: string;
      finishedAt: string;
    };
    waiting?: {
      reason: string;
      message?: string;
    };
  }>;
  podName?: string;
}

export interface TektonTaskRunKind {
  apiVersion: string;
  kind: 'TaskRun';
  metadata: TektonMetadata;
  spec: TektonTaskRunSpec;
  status?: TektonTaskRunStatus;
} 