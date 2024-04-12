import { Container } from 'shared/hostConfig';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { initEvent } from './syntheticEvent';

export const createRoot = (container: Container) => {
	const root = createContainer(container);

	return {
		render(element: ReactElementType) {
			initEvent(container, 'click');
			updateContainer(element, root);
		}
	};
};
