import { getPipelineRunDataModel, getPipelineFromPipelineRun } from '../pipeline-graph-utils';
import { TektonPipelineRunKind, TektonTaskRunKind } from '../../types/tekton';
import { PipelineRunNodeType, runStatus } from '../../types/pipeline-run';

// Mock PatternFly imports to avoid CSS parsing issues
jest.mock('@patternfly/react-topology', () => ({
  ModelKind: { graph: 'graph' },
  DEFAULT_LAYERS: ['default'],
}));

describe('pipeline-graph-utils', () => {
  describe('getPipelineFromPipelineRun', () => {
    it('should extract pipeline from pipeline run with pipelineSpec', () => {
      const pipelineRun: TektonPipelineRunKind = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-pipeline-run',
          namespace: 'default',
          labels: {
            'tekton.dev/pipeline': 'test-pipeline'
          }
        },
        spec: {
          pipelineSpec: {
            tasks: [
              { name: 'git-clone', taskRef: { name: 'git-clone' } },
              { name: 'build', taskRef: { name: 'buildah' }, runAfter: ['git-clone'] }
            ]
          }
        }
      };

      const pipeline = getPipelineFromPipelineRun(pipelineRun);

      expect(pipeline).toEqual({
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'Pipeline',
        metadata: {
          name: 'test-pipeline',
          namespace: 'default'
        },
        spec: {
          tasks: [
            { name: 'git-clone', taskRef: { name: 'git-clone' } },
            { name: 'build', taskRef: { name: 'buildah' }, runAfter: ['git-clone'] }
          ]
        }
      });
    });

    it('should extract pipeline from pipeline run with status pipelineSpec', () => {
      const pipelineRun: TektonPipelineRunKind = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-pipeline-run',
          namespace: 'default',
          labels: {
            'tekton.dev/pipeline': 'test-pipeline'
          }
        },
        spec: {},
        status: {
          pipelineSpec: {
            tasks: [
              { name: 'git-clone', taskRef: { name: 'git-clone' } }
            ]
          }
        }
      };

      const pipeline = getPipelineFromPipelineRun(pipelineRun);

      expect(pipeline).toBeTruthy();
      expect(pipeline?.spec.tasks).toHaveLength(1);
      expect(pipeline?.spec.tasks[0].name).toBe('git-clone');
    });

    it('should return null when pipeline name is missing', () => {
      const pipelineRun: TektonPipelineRunKind = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: '',
          namespace: 'default'
        },
        spec: {
          pipelineSpec: {
            tasks: [{ name: 'git-clone', taskRef: { name: 'git-clone' } }]
          }
        }
      };

      const pipeline = getPipelineFromPipelineRun(pipelineRun);
      expect(pipeline).toBeNull();
    });

    it('should return null when pipeline spec is missing', () => {
      const pipelineRun: TektonPipelineRunKind = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-pipeline-run',
          namespace: 'default',
          labels: {
            'tekton.dev/pipeline': 'test-pipeline'
          }
        },
        spec: {}
      };

      const pipeline = getPipelineFromPipelineRun(pipelineRun);
      expect(pipeline).toBeNull();
    });
  });

  describe('getPipelineRunDataModel', () => {
    const mockPipelineRun: TektonPipelineRunKind = {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'PipelineRun',
      metadata: {
        name: 'test-pipeline-run',
        namespace: 'default',
        labels: {
          'tekton.dev/pipeline': 'test-pipeline'
        }
      },
      spec: {
        pipelineSpec: {
          tasks: [
            { name: 'git-clone', taskRef: { name: 'git-clone' } },
            { name: 'build', taskRef: { name: 'buildah' }, runAfter: ['git-clone'] },
            { name: 'test', taskRef: { name: 'test' }, runAfter: ['build'] }
          ]
        }
      }
    };

    const mockTaskRuns: TektonTaskRunKind[] = [
      {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'TaskRun',
        metadata: {
          name: 'test-pipeline-run-git-clone',
          namespace: 'default',
          labels: {
            'tekton.dev/pipelineTask': 'git-clone'
          }
        },
        spec: { taskRef: { name: 'git-clone' } },
        status: {
          conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }]
        }
      },
      {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'TaskRun',
        metadata: {
          name: 'test-pipeline-run-build',
          namespace: 'default',
          labels: {
            'tekton.dev/pipelineTask': 'build'
          }
        },
        spec: { taskRef: { name: 'buildah' } },
        status: {
          conditions: [{ type: 'Succeeded', status: 'False', reason: 'Failed' }]
        }
      }
    ];

    it('should generate topology model with nodes and edges', () => {
      const model = getPipelineRunDataModel(mockPipelineRun, mockTaskRuns);

      expect(model).toBeTruthy();
      expect(model?.graph).toBeDefined();
      expect(model?.graph.id).toBe('pipelinerun-vis-graph');
      expect(model?.graph.type).toBe('graph');
      expect(model?.graph.layout).toBe('pipelinerun-visualization');

      // Verify nodes
      expect(model?.nodes).toHaveLength(3);
      expect(model?.nodes?.[0].id).toBe('git-clone');
      expect(model?.nodes?.[0].type).toBe(PipelineRunNodeType.TASK_NODE);
      expect(model?.nodes?.[0].label).toBe('git-clone');

      expect(model?.nodes?.[1].id).toBe('build');
      expect(model?.nodes?.[1].type).toBe(PipelineRunNodeType.TASK_NODE);
      expect(model?.nodes?.[1].label).toBe('build');

      // Verify edges
      expect(model?.edges).toHaveLength(2);
      expect(model?.edges?.[0].id).toBe('git-clone-build');
      expect(model?.edges?.[0].source).toBe('git-clone');
      expect(model?.edges?.[0].target).toBe('build');
      expect(model?.edges?.[0].type).toBe(PipelineRunNodeType.EDGE);

      expect(model?.edges?.[1].id).toBe('build-test');
      expect(model?.edges?.[1].source).toBe('build');
      expect(model?.edges?.[1].target).toBe('test');
    });

    it('should include task status in node data', () => {
      const model = getPipelineRunDataModel(mockPipelineRun, mockTaskRuns);

      // Git clone should be succeeded
      const gitCloneNode = model?.nodes?.find(n => n.id === 'git-clone');
      expect(gitCloneNode?.data.status).toBe(runStatus.Succeeded);
      expect(gitCloneNode?.data.taskRun).toBeDefined();
      expect(gitCloneNode?.data.taskRun?.metadata.name).toBe('test-pipeline-run-git-clone');

      // Build should be failed
      const buildNode = model?.nodes?.find(n => n.id === 'build');
      expect(buildNode?.data.status).toBe(runStatus.Failed);
      expect(buildNode?.data.taskRun).toBeDefined();

      // Test should be pending (no task run)
      const testNode = model?.nodes?.find(n => n.id === 'test');
      expect(testNode?.data.status).toBe(runStatus.Pending);
      expect(testNode?.data.taskRun).toBeUndefined();
    });

    it('should handle parallel tasks correctly', () => {
      const parallelPipelineRun: TektonPipelineRunKind = {
        ...mockPipelineRun,
        spec: {
          pipelineSpec: {
            tasks: [
              { name: 'setup', taskRef: { name: 'setup' } },
              { name: 'test-unit', taskRef: { name: 'test' }, runAfter: ['setup'] },
              { name: 'test-integration', taskRef: { name: 'test' }, runAfter: ['setup'] },
              { name: 'deploy', taskRef: { name: 'deploy' }, runAfter: ['test-unit', 'test-integration'] }
            ]
          }
        }
      };

      const model = getPipelineRunDataModel(parallelPipelineRun);

      expect(model?.nodes).toHaveLength(4);
      expect(model?.edges).toHaveLength(4);

      // Verify setup has no dependencies
      const setupNode = model?.nodes?.find(n => n.id === 'setup');
      expect(setupNode?.data.level).toBe(0);

      // Verify parallel tests depend on setup
      const testUnitNode = model?.nodes?.find(n => n.id === 'test-unit');
      const testIntegrationNode = model?.nodes?.find(n => n.id === 'test-integration');
      expect(testUnitNode?.data.level).toBe(1);
      expect(testIntegrationNode?.data.level).toBe(1);

      // Verify deploy depends on both tests
      const deployNode = model?.nodes?.find(n => n.id === 'deploy');
      expect(deployNode?.data.level).toBe(2);

      // Verify edges
      expect(model?.edges?.find(e => e.id === 'setup-test-unit')).toBeDefined();
      expect(model?.edges?.find(e => e.id === 'setup-test-integration')).toBeDefined();
      expect(model?.edges?.find(e => e.id === 'test-unit-deploy')).toBeDefined();
      expect(model?.edges?.find(e => e.id === 'test-integration-deploy')).toBeDefined();
    });

    it('should handle finally tasks', () => {
      const finallyPipelineRun: TektonPipelineRunKind = {
        ...mockPipelineRun,
        spec: {
          pipelineSpec: {
            tasks: [
              { name: 'build', taskRef: { name: 'build' } }
            ],
            finally: [
              { name: 'cleanup', taskRef: { name: 'cleanup' } },
              { name: 'notify', taskRef: { name: 'notify' } }
            ]
          }
        }
      };

      const model = getPipelineRunDataModel(finallyPipelineRun);

      expect(model?.nodes).toHaveLength(3);
      expect(model?.nodes?.find(n => n.id === 'build')).toBeDefined();
      expect(model?.nodes?.find(n => n.id === 'cleanup')).toBeDefined();
      expect(model?.nodes?.find(n => n.id === 'notify')).toBeDefined();
    });

    it('should calculate node widths based on labels', () => {
      const model = getPipelineRunDataModel(mockPipelineRun, mockTaskRuns);

      // All nodes at the same level should have the same width
      const levelZeroNodes = model?.nodes?.filter(n => n.data.level === 0);
      const levelOneNodes = model?.nodes?.filter(n => n.data.level === 1);
      const levelTwoNodes = model?.nodes?.filter(n => n.data.level === 2);

      // Check that nodes at same level have same width
      if (levelZeroNodes && levelZeroNodes.length > 1) {
        const firstWidth = levelZeroNodes[0].width;
        expect(levelZeroNodes.every(n => n.width === firstWidth)).toBe(true);
      }

      if (levelOneNodes && levelOneNodes.length > 1) {
        const firstWidth = levelOneNodes[0].width;
        expect(levelOneNodes.every(n => n.width === firstWidth)).toBe(true);
      }
    });

    it('should handle different task run statuses', () => {
      const mixedStatusTaskRuns: TektonTaskRunKind[] = [
        {
          ...mockTaskRuns[0],
          status: {
            conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }]
          }
        },
        {
          ...mockTaskRuns[1],
          metadata: {
            ...mockTaskRuns[1].metadata,
            labels: { 'tekton.dev/pipelineTask': 'build' }
          },
          status: {
            conditions: [{ type: 'Succeeded', status: 'Unknown', reason: 'Running' }]
          }
        },
        {
          apiVersion: 'tekton.dev/v1beta1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-test',
            namespace: 'default',
            labels: {
              'tekton.dev/pipelineTask': 'test'
            }
          },
          spec: { taskRef: { name: 'test' } },
          status: undefined // Pending
        }
      ];

      const model = getPipelineRunDataModel(mockPipelineRun, mixedStatusTaskRuns);

      const gitCloneNode = model?.nodes?.find(n => n.id === 'git-clone');
      const buildNode = model?.nodes?.find(n => n.id === 'build');
      const testNode = model?.nodes?.find(n => n.id === 'test');

      expect(gitCloneNode?.data.status).toBe(runStatus.Succeeded);
      expect(buildNode?.data.status).toBe(runStatus.Running);
      expect(testNode?.data.status).toBe(runStatus.Pending);
    });

    it('should return null for invalid pipeline run', () => {
      const invalidPipelineRun: TektonPipelineRunKind = {
        ...mockPipelineRun,
        metadata: {
          ...mockPipelineRun.metadata,
          labels: undefined
        },
        spec: {}
      };

      const model = getPipelineRunDataModel(invalidPipelineRun);
      expect(model).toBeNull();
    });

    it('should include namespace in node data', () => {
      const model = getPipelineRunDataModel(mockPipelineRun, mockTaskRuns);

      model?.nodes?.forEach(node => {
        expect(node.data.namespace).toBe('default');
      });
    });

    it('should set correct node dimensions', () => {
      const model = getPipelineRunDataModel(mockPipelineRun, mockTaskRuns);

      model?.nodes?.forEach(node => {
        expect(node.height).toBe(32); // DEFAULT_NODE_HEIGHT
        expect(node.width).toBeGreaterThan(0);
        expect(typeof node.width).toBe('number');
      });
    });

    it('should handle empty task runs array', () => {
      const model = getPipelineRunDataModel(mockPipelineRun, []);

      expect(model?.nodes).toHaveLength(3);
      
      // All tasks should be pending without task runs
      model?.nodes?.forEach(node => {
        expect(node.data.status).toBe(runStatus.Pending);
        expect(node.data.taskRun).toBeUndefined();
      });
    });
  });
}); 