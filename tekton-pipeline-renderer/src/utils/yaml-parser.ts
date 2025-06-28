import yaml from 'js-yaml';
import { TektonPipelineKind, TektonPipelineRunKind, TektonTaskRunKind } from '../types/tekton';

// Type aliases for backward compatibility
type PipelineKind = TektonPipelineKind;
type PipelineRunKind = TektonPipelineRunKind;
type TaskRunKind = TektonTaskRunKind;

export class YAMLParser {
  /**
   * Parse a YAML string into a Tekton resource
   * @param yamlString - The YAML string to parse
   * @returns The parsed Tekton resource
   */
  static parse<T = unknown>(yamlString: string): T {
    try {
      return yaml.load(yamlString) as T;
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse a YAML string into a Tekton Pipeline
   * @param yamlString - The YAML string to parse
   * @returns The parsed Pipeline
   */
  static parsePipeline(yamlString: string): PipelineKind {
    const parsed = this.parse(yamlString);
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML: Expected an object');
    }

    const pipeline = parsed as Record<string, unknown>;
    
    if (pipeline.kind !== 'Pipeline' || !(pipeline.apiVersion as string)?.includes('tekton.dev')) {
      throw new Error('Invalid YAML: Expected a Tekton Pipeline resource');
    }

    return pipeline as unknown as PipelineKind;
  }

  /**
   * Parse a YAML string into a Tekton PipelineRun
   * @param yamlString - The YAML string to parse
   * @returns The parsed PipelineRun
   */
  static parsePipelineRun(yamlString: string): PipelineRunKind {
    const parsed = this.parse(yamlString);
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML: Expected an object');
    }

    const pipelineRun = parsed as Record<string, unknown>;
    
    if (pipelineRun.kind !== 'PipelineRun' || !(pipelineRun.apiVersion as string)?.includes('tekton.dev')) {
      throw new Error('Invalid YAML: Expected a Tekton PipelineRun resource');
    }

    return pipelineRun as unknown as PipelineRunKind;
  }

  /**
   * Parse a YAML string into a Tekton TaskRun
   * @param yamlString - The YAML string to parse
   * @returns The parsed TaskRun
   */
  static parseTaskRun(yamlString: string): TaskRunKind {
    const parsed = this.parse(yamlString);
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML: Expected an object');
    }

    const taskRun = parsed as Record<string, unknown>;
    
    if (taskRun.kind !== 'TaskRun' || !(taskRun.apiVersion as string)?.includes('tekton.dev')) {
      throw new Error('Invalid YAML: Expected a Tekton TaskRun resource');
    }

    return taskRun as unknown as TaskRunKind;
  }

  /**
   * Parse multiple YAML documents from a string
   * @param yamlString - The YAML string containing multiple documents
   * @returns Array of parsed resources
   */
  static parseMultiple(yamlString: string): unknown[] {
    try {
      return yaml.loadAll(yamlString);
    } catch (error) {
      throw new Error(`Failed to parse YAML documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert a JavaScript object back to YAML
   * @param obj - The object to convert
   * @returns The YAML string
   */
  static stringify(obj: unknown): string {
    try {
      return yaml.dump(obj, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
      });
    } catch (error) {
      throw new Error(`Failed to stringify object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that a parsed object is a valid Tekton resource
   * @param obj - The object to validate
   * @returns True if valid, throws error if invalid
   */
  static validateTektonResource(obj: unknown): boolean {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Invalid resource: Expected an object');
    }

    const resource = obj as Record<string, unknown>;
    
    if (!resource.apiVersion || !resource.kind) {
      throw new Error('Invalid Tekton resource: Missing apiVersion or kind');
    }

    if (!(resource.apiVersion as string).includes('tekton.dev')) {
      throw new Error('Invalid Tekton resource: apiVersion must include tekton.dev');
    }

    const metadata = resource.metadata as Record<string, unknown>;
    if (!metadata?.name) {
      throw new Error('Invalid Tekton resource: Missing metadata.name');
    }

    return true;
  }
} 