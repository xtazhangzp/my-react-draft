import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'shared/hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

export const commitMutationEffects = (finishedWork: FiberNode) => {
	let nextEffect: FiberNode | null = finishedWork;

	while (nextEffect !== null) {
		const child = nextEffect.child;

		if (nextEffect.subtreeFlage & MutationMask && child !== null) {
			nextEffect = child;
		} else {
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);
				const sibling = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}

				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	let flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}

	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}

	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
};

const recordHostChildrenToDelete = (
	childrenToDelete: FiberNode[],
	unmountfiber: FiberNode
) => {
	const lastOne = childrenToDelete[childrenToDelete.length - 1];

	if (!lastOne) {
		childrenToDelete.push(unmountfiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountfiber === node) {
				childrenToDelete.push(unmountfiber);
			}
			node = node.sibling;
		}
	}
};

const commitDeletion = (childToDelete: FiberNode) => {
	let rootChildrenToDelete: FiberNode[] = [];

	commitNestedDeletion(childToDelete, (unmountfiber) => {
		switch (unmountfiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountfiber);
				return;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountfiber);
				return;
			case FunctionComponent:
				return;
			default:
				console.error('未处理的umount类型');
		}
	});

	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode as Element, hostParent);
			});
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
};

const commitNestedDeletion = (
	root: FiberNode,
	onCommitUnmount: (child: FiberNode) => void
) => {
	let node = root;

	while (true) {
		onCommitUnmount(node);

		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === root) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node === root) {
				return;
			}

			node = node.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;
	}
};

const commitPlacement = (finishedWork: FiberNode) => {
	const hostParent = getHostParent(finishedWork);

	const sibling = getHostSibling(finishedWork);

	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(
			finishedWork,
			hostParent,
			sibling as Instance
		);
	}
};

const getHostSibling = (fiber: FiberNode) => {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		while (node.sibling === null) {
			let parent = node.return;

			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag == HostRoot
			) {
				return null;
			}

			node = parent;
		}

		node.sibling.return = node.return;
		node = node.sibling;

		while (node.tag !== HostText && node.tag !== HostComponent) {
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}

			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
};

const getHostParent = (fiber: FiberNode) => {
	let parent = fiber.return;

	while (parent !== null) {
		if (parent.tag === HostComponent) {
			return parent.stateNode as Container;
		} else if (parent.tag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container as Container;
		}
		parent = parent.return;
	}

	console.error('没有找到hostParent');
	return null;
};

const insertOrAppendPlacementNodeIntoContainer = (
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) => {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(
				finishedWork.stateNode as Instance,
				hostParent,
				before
			);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode as Instance);
		}
		return;
	}
	let child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;
		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
};
