import { YAMLParser } from '../yaml-parser';
import yaml from 'js-yaml';

// Mock js-yaml
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('YAMLParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parse', () => {
    it('should parse valid YAML string', () => {
      const yamlString = 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test';
      const expected = { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'test' } };
      
      mockYaml.load.mockReturnValue(expected);
      
      const result = YAMLParser.parse(yamlString);
      
      expect(mockYaml.load).toHaveBeenCalledWith(yamlString);
      expect(result).toEqual(expected);
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: content: [';
      
      mockYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });
      
      expect(() => YAMLParser.parse(invalidYaml)).toThrow('Failed to parse YAML: Invalid YAML');
    });
  });

  describe('parsePipeline', () => {
    it('should parse valid pipeline YAML', () => {
      const pipelineYaml = `
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: test-pipeline
spec:
  tasks:
    - name: task1
      taskRef:
        name: task1
      `;
      
      const expected = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'Pipeline',
        metadata: { name: 'test-pipeline' },
        spec: { tasks: [{ name: 'task1', taskRef: { name: 'task1' } }] }
      };
      
      mockYaml.load.mockReturnValue(expected);
      
      const result = YAMLParser.parsePipeline(pipelineYaml);
      
      expect(result).toEqual(expected);
    });

    it('should throw error for non-pipeline YAML', () => {
      const nonPipelineYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: test
      `;
      
      mockYaml.load.mockReturnValue({
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: 'test' }
      });
      
      expect(() => YAMLParser.parsePipeline(nonPipelineYaml)).toThrow('Invalid YAML: Expected a Tekton Pipeline resource');
    });

    it('should throw error for invalid YAML structure', () => {
      mockYaml.load.mockReturnValue(null);
      
      expect(() => YAMLParser.parsePipeline('')).toThrow('Invalid YAML: Expected an object');
    });
  });

  describe('parsePipelineRun', () => {
    it('should parse valid pipeline run YAML', () => {
      const pipelineRunYaml = `
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: test-pipeline-run
spec:
  pipelineRef:
    name: test-pipeline
      `;
      
      const expected = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: { name: 'test-pipeline-run' },
        spec: { pipelineRef: { name: 'test-pipeline' } }
      };
      
      mockYaml.load.mockReturnValue(expected);
      
      const result = YAMLParser.parsePipelineRun(pipelineRunYaml);
      
      expect(result).toEqual(expected);
    });

    it('should throw error for non-pipeline run YAML', () => {
      const nonPipelineRunYaml = `
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: test
      `;
      
      mockYaml.load.mockReturnValue({
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'Pipeline',
        metadata: { name: 'test' }
      });
      
      expect(() => YAMLParser.parsePipelineRun(nonPipelineRunYaml)).toThrow('Invalid YAML: Expected a Tekton PipelineRun resource');
    });
  });

  describe('parseTaskRun', () => {
    it('should parse valid task run YAML', () => {
      const taskRunYaml = `
apiVersion: tekton.dev/v1beta1
kind: TaskRun
metadata:
  name: test-task-run
spec:
  taskRef:
    name: test-task
      `;
      
      const expected = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'TaskRun',
        metadata: { name: 'test-task-run' },
        spec: { taskRef: { name: 'test-task' } }
      };
      
      mockYaml.load.mockReturnValue(expected);
      
      const result = YAMLParser.parseTaskRun(taskRunYaml);
      
      expect(result).toEqual(expected);
    });

    it('should throw error for non-task run YAML', () => {
      const nonTaskRunYaml = `
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: test
      `;
      
      mockYaml.load.mockReturnValue({
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'Pipeline',
        metadata: { name: 'test' }
      });
      
      expect(() => YAMLParser.parseTaskRun(nonTaskRunYaml)).toThrow('Invalid YAML: Expected a Tekton TaskRun resource');
    });
  });

  describe('parseMultiple', () => {
    it('should parse multiple YAML documents', () => {
      const multiYaml = `
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: config1
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: config2
      `;
      
      const expected = [
        { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'config1' } },
        { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'config2' } }
      ];
      
      (mockYaml.loadAll as jest.Mock).mockReturnValue(expected);
      
      const result = YAMLParser.parseMultiple(multiYaml);
      
      expect(mockYaml.loadAll).toHaveBeenCalledWith(multiYaml);
      expect(result).toEqual(expected);
    });

    it('should throw error for invalid multi-document YAML', () => {
      const invalidMultiYaml = 'invalid: yaml: content: [';
      
      mockYaml.loadAll.mockImplementation(() => {
        throw new Error('Invalid multi-document YAML');
      });
      
      expect(() => YAMLParser.parseMultiple(invalidMultiYaml)).toThrow('Failed to parse YAML documents: Invalid multi-document YAML');
    });
  });

  describe('stringify', () => {
    it('should convert object to YAML string', () => {
      const obj = { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'test' } };
      const expectedYaml = 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test\n';
      
      mockYaml.dump.mockReturnValue(expectedYaml);
      
      const result = YAMLParser.stringify(obj);
      
      expect(mockYaml.dump).toHaveBeenCalledWith(obj, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
      });
      expect(result).toBe(expectedYaml);
    });

    it('should throw error for invalid object', () => {
      const invalidObj: any = { circular: null };
      invalidObj.circular = invalidObj; // Create circular reference
      
      mockYaml.dump.mockImplementation(() => {
        throw new Error('Circular reference');
      });
      
      expect(() => YAMLParser.stringify(invalidObj)).toThrow('Failed to stringify object: Circular reference');
    });
  });

  describe('validateTektonResource', () => {
    it('should validate correct Tekton resource', () => {
      const validResource = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'Pipeline',
        metadata: { name: 'test-pipeline' }
      };
      
      expect(YAMLParser.validateTektonResource(validResource)).toBe(true);
    });

    it('should throw error for missing apiVersion', () => {
      const invalidResource = {
        kind: 'Pipeline',
        metadata: { name: 'test-pipeline' }
      };
      
      expect(() => YAMLParser.validateTektonResource(invalidResource)).toThrow('Invalid Tekton resource: Missing apiVersion or kind');
    });

    it('should throw error for missing kind', () => {
      const invalidResource = {
        apiVersion: 'tekton.dev/v1beta1',
        metadata: { name: 'test-pipeline' }
      };
      
      expect(() => YAMLParser.validateTektonResource(invalidResource)).toThrow('Invalid Tekton resource: Missing apiVersion or kind');
    });

    it('should throw error for non-Tekton apiVersion', () => {
      const invalidResource = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: 'test' }
      };
      
      expect(() => YAMLParser.validateTektonResource(invalidResource)).toThrow('Invalid Tekton resource: apiVersion must include tekton.dev');
    });

    it('should throw error for missing metadata.name', () => {
      const invalidResource = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'Pipeline',
        metadata: {}
      };
      
      expect(() => YAMLParser.validateTektonResource(invalidResource)).toThrow('Invalid Tekton resource: Missing metadata.name');
    });

    it('should throw error for non-object input', () => {
      expect(() => YAMLParser.validateTektonResource(null)).toThrow('Invalid resource: Expected an object');
      expect(() => YAMLParser.validateTektonResource('string')).toThrow('Invalid resource: Expected an object');
      expect(() => YAMLParser.validateTektonResource(123)).toThrow('Invalid resource: Expected an object');
    });
  });
}); 