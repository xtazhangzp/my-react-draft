import { Action, Props, ReactElementType, Ref } from 'shared/ReactTypes';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	WorkTag
} from './workTags';
import { Key } from 'shared/ReactTypes';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'shared/hostConfig';

export class FiberNode {
	stateNode: FiberRootNode | Element | Text | null = null;
	type: any = null;

	return: FiberNode | null = null;
	child: FiberNode | null = null;
	sibling: FiberNode | null = null;
	index: number = 0;

	ref: Ref | null = null;

	memoizedProps: Props | null = null;
	memoizedState: any = null;
	updateQueue: unknown = null;

	alternate: FiberNode | null = null;

	flags: Flags = NoFlags;
	subtreeFlage: Flags = NoFlags;
	deletions: FiberNode[] | null = null;

	constructor(
		public tag: WorkTag,
		public pendingProps: Props,
		public key: Key = null
	) {}
}

export class FiberRootNode {
	finishedWork: FiberNode | null = null;
	constructor(
		public container: Container,
		public current: FiberNode
	) {
		this.current.stateNode = this;
	}
}

export const createWorkInProcess = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	if (wip === null) {
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlage = NoFlags;
		wip.deletions = null;
	}

	wip.type = current.type;
	// wip.return = current.return;
	wip.child = current.child;
	// wip.index = 0;

	// wip.ref = current.ref;

	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;
	wip.updateQueue = current.updateQueue;
	return wip;
};

export const createFiberFromElement = (
	element: ReactElementType
): FiberNode => {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type !== 'function') {
		console.error('未定义的type类型', element);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
};

export const createFiberFromFragment = (elements: any[], key: Key) => {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
};
