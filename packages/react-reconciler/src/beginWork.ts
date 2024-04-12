import { ReactElementType } from 'shared/ReactTypes';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { FiberNode } from './fiber';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';

export const beginWork = (wip: FiberNode): FiberNode | null => {
	// 比较子ReactElement和子Fiber 返回子Fiber
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip);
		case Fragment:
			return updateFragment(wip);
		default:
			console.error('beginwork 未实现的类型', wip);
			return null;
	}
};

const updateFragment = (wip: FiberNode) => {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateFunctionComponent = (wip: FiberNode) => {
	const nextChildren = renderWithHooks(wip);
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateHostRoot = (wip: FiberNode) => {
	const baseState = wip.memoizedState;
	let updateQueue = wip.updateQueue as UpdateQueue<ReactElementType | null>;
	let pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	let { memoizedState } = processUpdateQueue<ReactElementType | null>(
		baseState,
		pending
	);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateHostComponent = (wip: FiberNode) => {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const reconcileChildren = (wip: FiberNode, children?: ReactElementType) => {
	const current = wip.alternate;

	if (current !== null) {
		wip.child = reconcileChildFibers(wip, current.child, children);
	} else {
		wip.child = mountChildFibers(wip, null, children);
	}
};
