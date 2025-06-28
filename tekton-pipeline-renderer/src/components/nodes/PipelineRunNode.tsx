import * as React from 'react';
import {
  DEFAULT_WHEN_OFFSET,
  Node,
  TaskNode,
  WhenDecorator,
  WithContextMenuProps,
  WithSelectionProps,
  withSelection,
  NodeModel,
  RunStatus,
} from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { PipelineRunNodeData, runStatus } from '../../types/pipeline-run';

type PipelineRunNodeProps = {
  element: Node<NodeModel, PipelineRunNodeData>;
} & WithContextMenuProps &
  WithSelectionProps;

const runStatusToRunStatus = (status?: runStatus): RunStatus => {
  switch (status) {
    case runStatus.Succeeded:
      return RunStatus.Succeeded;
    case runStatus.Failed:
      return RunStatus.Failed;
    case runStatus.Running:
      return RunStatus.Running;
    case runStatus.Cancelled:
      return RunStatus.Cancelled;
    case runStatus.Pending:
      return RunStatus.Pending;
    default:
      return RunStatus.Pending;
  }
};

const getTaskBadgeCount = (data: PipelineRunNodeData): number =>
  (data.testFailCount ?? 0) + (data.testWarnCount ?? 0) || 0;

const PipelineRunNode: React.FunctionComponent<React.PropsWithChildren<PipelineRunNodeProps>> = ({
  element,
  ...rest
}) => {
  const data = element.getData();
  if (!data) return null;
  
  const status = runStatusToRunStatus(data.status);
  const badgeCount = getTaskBadgeCount(data);

  const whenDecorator = data.whenStatus ? (
    <WhenDecorator element={element} status={data.whenStatus} leftOffset={DEFAULT_WHEN_OFFSET} />
  ) : null;

  return (
    <TaskNode
      className="pipelinerun-node"
      element={element}
      status={status}
      badge={badgeCount ? `${badgeCount}` : undefined}
      badgeClassName="pipelinerun-node__test-status-badge--warning"
      toolTip={
        <div>
          <strong>{data.task.name}</strong>
          {data.status && <div>Status: {data.status}</div>}
        </div>
      }
      toolTipProps={{
        className: 'pipelinerun-node__tooltip',
        position: 'top',
      }}
      {...rest}
      truncateLength={Infinity}
    >
      {whenDecorator}
    </TaskNode>
  );
};

export default withSelection()(observer(PipelineRunNode)); 