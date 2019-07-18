import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleaware from './app/middlewares/auth';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import SubscribeController from './app/controllers/SubscribeController';
import OrganizedController from './app/controllers/OrganizedController';

const routes = new Router();

const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleaware);

routes.put('/users', UserController.update);
routes.post('/files', upload.single('file'), FileController.store);

routes.post('/meetups', MeetupController.store);
routes.get('/meetups', MeetupController.index);
routes.put('/meetups/:meetupId', MeetupController.update);
routes.delete('/meetups/:meetupId', MeetupController.delete);
routes.get('/organized', OrganizedController.index);

routes.post('/subscribe', SubscribeController.store);
routes.get('/subscribe', SubscribeController.index);
routes.delete('/subscribe/:subscribeId', SubscribeController.delete);

export default routes;
