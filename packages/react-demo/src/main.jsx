import { createElement as jsx, useState, Fragment } from 'react';
import * as ReactDOM from 'react-dom';

function App() {
	const [num, setNum] = useState(0);

	// return jsx('div', {
	// 	onClick: () => setNum(num + 1),
	// 	children: num
	// });

	const arr =
		num % 2 === 0
			? [
					jsx('li', {
						children: '1',
						key: '1'
					}),
					jsx('li', {
						children: '2',
						key: '2'
					}),
					jsx('li', {
						children: '3',
						key: '3'
					})
				]
			: [
					jsx('li', {
						children: '3',
						key: '3'
					}),
					jsx('li', {
						children: '2',
						key: '2'
					}),

					jsx('li', {
						children: '1',
						key: '1'
					})
				];

	return jsx('ul', {
		onClick: () => setNum(num + 1),
		children: arr
	});

	// return jsx('ul', {
	// 	onClick: () => setNum(num + 1),
	// 	children: [
	// 		jsx('li', {
	// 			children: '4',
	// 			key: '4'
	// 		}),
	// 		jsx('li', {
	// 			children: '5',
	// 			key: '5'
	// 		}),
	// 		arr
	// 	]
	// });

	// return jsx(Fragment, {
	// 	children: [
	// 		jsx(
	// 			'li',
	// 			{
	// 				children: '4'
	// 			},
	// 			'4'
	// 		),
	// 		jsx(
	// 			'li',
	// 			{
	// 				children: '5'
	// 			},
	// 			'5'
	// 		)
	// 	]
	// });
}

debugger;
ReactDOM.createRoot(document.getElementById('root')).render(jsx(App, {}));
