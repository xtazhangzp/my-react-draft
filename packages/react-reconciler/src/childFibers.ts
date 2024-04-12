import { Key, Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProcess
} from './fiber';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Fragment, HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

type ExistingChildren = Map<string | number, FiberNode>;

const useFiber = (fiber: FiberNode, pendingProps: Props) => {
	const clone = createWorkInProcess(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
};

const ChildReconciler = (shouldTrackEffects: boolean) => {
	const deleteRemainingChildren = (
		returnFiber: FiberNode,
		currentFirstFiber: FiberNode | null
	) => {
		if (!shouldTrackEffects) {
			return;
		}

		let childToDelete = currentFirstFiber;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	};

	const deleteChild = (returnFiber: FiberNode, childToDelete: FiberNode) => {
		if (!shouldTrackEffects) {
			return;
		}

		let deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags != ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	};

	const placeSingleChild = (fiber: FiberNode) => {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}

		return fiber;
	};

	const reconcileSingleElement = (
		returnFiber: FiberNode,
		currentFiber,
		element: ReactElementType
	) => {
		const key = element.key;

		while (currentFiber !== null) {
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						let props = element.props;

						if (element.type === REACT_FRAGMENT_TYPE) {
							props = props.children;
						}

						const existing = useFiber(currentFiber, props);
						existing.return = returnFiber;
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					}

					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					console.error('还未实现的react类型');
					break;
				}
			} else {
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}

		let fiber;

		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			fiber = createFiberFromElement(element);
		}
		fiber.return = returnFiber;
		return fiber;
	};

	const reconcileSingleTextNode = (
		returnFiber: FiberNode,
		currentFiber,
		content: string | number
	) => {
		while (currentFiber !== null) {
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			} else {
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	};

	const reconcileChildrenArray = (
		returnFiber: FiberNode,
		currentFirstFiber: FiberNode | null,
		newChid: any[]
	) => {
		let lastPlacedIndex = 0;
		let lastNewFiber: FiberNode | null = null;
		let firstNewFiber: FiberNode | null = null;

		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstFiber;

		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChid.length; i++) {
			const after = newChid[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);

			if (newFiber === null) {
				continue;
			}

			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;

				if (oldIndex < lastPlacedIndex) {
					newFiber.flags |= Placement;
					continue;
				} else {
					lastPlacedIndex = oldIndex;
				}
			} else {
				newFiber.flags |= Placement;
			}
		}

		existingChildren.forEach((childToDelete) => {
			deleteChild(returnFiber, childToDelete);
		});

		return firstNewFiber;
	};

	const updateFromMap = (
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	) => {
		const keyToUse = element.key != null ? element.key : index;
		const before = existingChildren.get(keyToUse);

		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				} else {
					deleteChild(returnFiber, before);
				}
			}

			return new FiberNode(HostText, { contet: element + '' }, null);
		}

		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							keyToUse,
							existingChildren
						);
					}

					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}
		}

		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				keyToUse,
				existingChildren
			);
		}

		return null;
	};

	const updateFragment = (
		returnFiber: FiberNode,
		current: FiberNode | undefined,
		elements: any[],
		key: Key,
		existingChildren: ExistingChildren
	) => {
		let fiber;
		if (current === undefined || current.tag !== Fragment) {
			fiber = createFiberFromFragment(elements, key);
		} else {
			existingChildren.delete(key);
			fiber = useFiber(current, elements);
		}

		fiber.return = returnFiber;
		return fiber;
	};

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: any
	) {
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;

		if (isUnkeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}

		if (typeof newChild === 'object' && newChild !== null) {
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}

			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					console.error('未实现的reconcile类型', newChild);
			}
		}

		// 文本节点
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (currentFiber !== null) {
			deleteRemainingChildren(returnFiber, currentFiber);
		}

		console.log('未实现的reconcile类型', newChild);
		return null;
	};
};

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
