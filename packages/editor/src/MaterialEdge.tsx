import { BaseEdge, getBezierPath, type ConnectionLineComponentProps, type EdgeProps } from '@xyflow/react';
import { socketColor } from './socket-colors.js';
import type { FlowNode } from './MaterialNode.js';

export function MaterialEdge(props: EdgeProps) {
  const [path] = getBezierPath(props);
  return (
    <>
      {props.data?.invalid === true && (
        <path
          className="mtlx-error-outline"
          d={path}
          fill="none"
          stroke="#dc2626"
          strokeWidth={8}
          pointerEvents="none"
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        style={props.style}
        markerEnd={props.markerEnd}
        markerStart={props.markerStart}
      />
    </>
  );
}
export const edgeTypes = { materialx: MaterialEdge };

export function MaterialConnectionLine({
  fromNode,
  connectionStatus,
  fromHandle,
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps<FlowNode>) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
  });
  const type = fromNode.data.portType(
    fromNode.id,
    fromHandle.type === 'source' ? 'output' : 'input',
    fromHandle.id ?? '',
  );
  return (
    <>
      {connectionStatus === 'invalid' && <path d={path} fill="none" stroke="#dc2626" strokeWidth={8} />}
      <path d={path} fill="none" stroke={socketColor(type)} strokeWidth={2} />
    </>
  );
}
