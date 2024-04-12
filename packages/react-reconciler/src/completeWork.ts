import {
	Container,
	appendInitialChild,
	createInstance,
	createTextInstance
} from 'shared/hostConfig';
import { FiberNode } from './fiber';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { NoFlags, Update } from './fiberFlags';
import {
	DOMElement,
	updateFiberProps
} from '../../react-dom/src/syntheticEvent';

const markUpdate = (fiber: FiberNode) => {
	fiber.flags |= Update;
};

export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				updateFiberProps(wip.stateNode as DOMElement, newProps);
			} else {
				const instance = createInstance(wip.type, newProps);
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				const instance = createTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
		case FunctionComponent:
		case Fragment:
			bubbleProperties(wip);
			return null;
		default:
			console.error('未处理的completeWork情况', wip);
			return null;
	}
};

const appendAllChildren = (parent: Container, wip: FiberNode) => {
	let node = wip.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode as Element);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}

			node = node?.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;
	}
};

const bubbleProperties = (wip: FiberNode) => {
	let subtreeFlage = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlage |= child.subtreeFlage;
		subtreeFlage |= child.flags;

		child.return = wip;
		child = child.sibling;
	}

	wip.subtreeFlage |= subtreeFlage;
};
