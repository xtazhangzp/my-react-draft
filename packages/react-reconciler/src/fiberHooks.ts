import { Dispatch, Dispatcher } from '../../react/src/currentDispatcher';
import { FiberNode } from './fiber';
import internals from 'shared/internals';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnfiber } from './workLoop';

let currentlyRenderFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

const { currentDispatcher } = internals;

export interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export const renderWithHooks = (wip: FiberNode) => {
	currentlyRenderFiber = wip;
	wip.memoizedState = null;

	const current = wip.alternate;
	if (current !== null) {
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);
	currentlyRenderFiber = null;
	workInProgressHook = null;
	currentHook = null;

	return children;
};

const mountState = <State>(
	initialState: State | (() => State)
): [State, Dispatch<State>] => {
	const hook = mountWorkInProgressHook();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	const dispatch = dispatchSetState.bind(null, currentlyRenderFiber, queue);
	queue.dispatch = dispatch;

	return [memoizedState, dispatch];
};

const updateState = <State>(): [State, Dispatch<State>] => {
	const hook = updateWorkInProgressHook();
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
		hook.memoizedState = memoizedState;
	}

	return [hook.memoizedState, queue.dispatch!];
};

const updateWorkInProgressHook = () => {
	let nextCurrentHook: Hook | null = null;

	if (currentHook === null) {
		const current = currentlyRenderFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		nextCurrentHook = currentHook.next;
	}

	if (nextCurrentHook === null) {
		throw new Error('本次执行的hook比上次多');
	}

	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		if (currentlyRenderFiber === null) {
			throw new Error('hooks只能在函数组件中运行');
		} else {
			workInProgressHook = newHook;
			currentlyRenderFiber.memoizedState = workInProgressHook;
		}
	} else {
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}

	return workInProgressHook;
};

const dispatchSetState = <State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) => {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnfiber(fiber);
};

const mountWorkInProgressHook = (): Hook => {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};

	if (workInProgressHook === null) {
		if (currentlyRenderFiber === null) {
			throw new Error('hooks只能在函数组件中运行');
		} else {
			workInProgressHook = hook;
			currentlyRenderFiber.memoizedState = workInProgressHook;
		}
	} else {
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}

	return workInProgressHook;
};

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};
