import { REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import {
	Dispatcher,
	resolveDispatcher,
	currentDispatcher
} from './src/currentDispatcher';
import { jsx } from './src/jsx';

export const versoin = '0.0.2';

export const createElement = jsx;

export const Fragment = REACT_FRAGMENT_TYPE;

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};
