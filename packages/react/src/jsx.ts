import {
	REACT_ELEMENT_TYPE,
	REACT_FRAGMENT_TYPE
} from 'shared/ReactSymbols.ts';
import {
	Key,
	Props,
	ReactElementType,
	Ref,
	ElementType
} from 'shared/ReactTypes';

const ReactElement = function (
	type: ElementType,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props
	};

	return element;
};

export const jsx = (type: ElementType, config: any, ...children: any[]) => {
	let key: Key = null;
	let ref: Ref = null;
	let props: Props = {};

	for (let prop in config) {
		const val = config[prop];
		if (val !== undefined) {
			if (prop === 'key') {
				key = '' + val;
			} else if (prop === 'ref') {
				ref = val;
			} else if (Object.prototype.hasOwnProperty.call(config, prop)) {
				props[prop] = val;
			}
		}
	}

	if (children.length) {
		if (children.length === 1) {
			props.children = children[0];
		} else {
			props.children = children;
		}
	}

	return ReactElement(type, key, ref, props);
};
