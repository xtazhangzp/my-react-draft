import { FiberNode } from '../react-reconciler/src/fiber';
import { HostText } from '../react-reconciler/src/workTags';
import { DOMElement, updateFiberProps } from '../react-dom/src/syntheticEvent';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: any): Instance => {
	const instance = document.createElement(type) as unknown;
	updateFiberProps(instance as DOMElement, props);
	return instance as DOMElement;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
): any => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export const commitUpdate = (fiber: FiberNode) => {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode as TextInstance, text);
		default:
			console.error('未实现的update类型', fiber);
	}
};

export const commitTextUpdate = (
	textInstance: TextInstance,
	content: string
) => {
	textInstance.textContent = content;
};

export const removeChild = (
	child: Instance | TextInstance,
	container: Container
) => {
	container.removeChild(child);
};

export const insertChildToContainer = (
	child: Instance,
	container: Container,
	before: Instance
) => {
	container.insertBefore(child, before);
};
