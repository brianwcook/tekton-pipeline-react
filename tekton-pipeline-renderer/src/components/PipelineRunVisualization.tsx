import React from 'react';
import { layoutFactory } from '../factories/layoutFactory';
import VisualizationFactory from './VisualizationFactory';
import { pipelineRunComponentFactory } from '../factories/pipelineRunComponentFactory';
import { getPipelineRunDataModel } from '../utils/pipeline-graph-utils';
import { TektonPipelineRunKind, TektonTaskRunKind } from '../types/tekton';

const PipelineRunVisualization: React.FC<{
  pipelineRun: TektonPipelineRunKind;
  error?: unknown;
  taskRuns?: TektonTaskRunKind[];
}> = ({ pipelineRun, error, taskRuns = [] }) => {
  const model = React.useMemo(() => {
    return getPipelineRunDataModel(pipelineRun, taskRuns);
  }, [pipelineRun, taskRuns]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#d73a49' }}>
        <h3>Error Loading Pipeline Run</h3>
        <p>{String(error)}</p>
      </div>
    );
  }
  
  if (!model) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No pipeline run data available</p>
      </div>
    );
  }

  return (
    <div className="pipelinerun-graph" data-test="pipelinerun-graph">
      <VisualizationFactory
        componentFactory={pipelineRunComponentFactory}
        layoutFactory={layoutFactory}
        model={model}
      />
    </div>
  );
};

export default PipelineRunVisualization; 