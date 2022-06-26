import { Router } from 'express';

const appRoutes = Router({
	mergeParams: true,
	caseSensitive: true,
	strict: true,
});

appRoutes.get('/favicon.ico', (_, response) => response.sendStatus(200));

appRoutes.get('/', (req, res) => {
	return res.json({
		date: new Date().toISOString(),
		message: 'Hello World!',
	});
});

export default appRoutes;
