import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProcess } from './fiber';
import { MutationMask } from './fiberFlags';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;

const prepareFreshStack = (root: FiberRootNode) => {
	workInProgress = createWorkInProcess(root.current, {});
};

export const scheduleUpdateOnfiber = (fiber: FiberNode) => {
	const root = markUpdateFromFiberToroot(fiber);
	renderRoot(root);
};

const markUpdateFromFiberToroot = (fiber: FiberNode) => {
	let node = fiber;
	let parent = node.return;

	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	if (node.tag === HostRoot) {
		return node.stateNode as FiberRootNode;
	}

	return null;
};

export const renderRoot = (root: FiberRootNode | null) => {
	if (root === null) {
		return;
	}
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.log('workLoop 出错了', e);
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	commitRoot(root);
};

const commitRoot = (root: FiberRootNode) => {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) {
		return;
	}

	root.finishedWork = null;

	const subtreeHasEffect = finishedWork.subtreeFlage | MutationMask;
	const rootHasEffect = finishedWork.flags | MutationMask;

	if (subtreeHasEffect || rootHasEffect) {
		//beforeMutation

		// mutation
		commitMutationEffects(finishedWork);
		root.current = finishedWork;
		// layout
	} else {
		root.current = finishedWork;
	}
};

const workLoop = () => {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
};

const performUnitOfWork = (fiber: FiberNode) => {
	let next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
};

const completeUnitOfWork = (fiber: FiberNode) => {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
};
