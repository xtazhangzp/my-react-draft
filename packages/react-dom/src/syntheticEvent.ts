import { Props } from 'shared/ReactTypes';
import { Container } from 'shared/hostConfig';
// type Props = any;
// type Container = any;

export const elementPropsKey = '__props';
const validEventTypeList = ['click'];

type EventCallback = (e: Event) => void;
interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

export const updateFiberProps = (node: DOMElement, props: Props) => {
	node[elementPropsKey] = props;
};

export const initEvent = (container: Container, eventType: string) => {
	if (!validEventTypeList.includes(eventType)) {
		console.error('当前不支持的事件', eventType);
		return;
	}

	container.addEventListener(eventType, (e) => {
		dispatch(container, eventType, e);
	});
};

const dispatch = (container: Container, eventType: string, e: Event) => {
	const targetElement = e.target;
	if (targetElement === null) {
		return;
	}

	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);

	const se = createSyntheticEvent(e);

	triggerEventFlow(capture, se);
	if (!se.__stopPropagation) {
		triggerEventFlow(bubble, se);
	}
};

const triggerEventFlow = (paths: EventCallback[], se: SyntheticEvent) => {
	for (let i = 0; i < paths.length; i++) {
		let callback = paths[i];
		callback.call(null, se);
		if (se.__stopPropagation) {
			break;
		}
	}
};

const createSyntheticEvent = (e: Event) => {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		originStopPropagation();
	};

	return syntheticEvent;
};

const collectPaths = (
	targetElement: DOMElement,
	container: Container,
	eventType: string
) => {
	const paths: Paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			let callbackList = getEventCallbackNameFromEventType(eventType);
			if (callbackList) {
				callbackList.forEach((callback, i) => {
					const eventCallback = elementProps[callback];
					if (eventCallback) {
						if (i === 0) {
							paths.capture.unshift(eventCallback);
						} else {
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}

	return paths;
};

const getEventCallbackNameFromEventType = (eventType: string) => {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
};
