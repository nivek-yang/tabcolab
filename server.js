import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/config/swaggerSpecSetup.js';
import debug from 'debug';
import morgan from 'morgan';

// config
import { API_VERSION, PORT, SESSION_SECRET, corsOptions } from './config/config.js';
// db connection
import './config/dbConnect.js';

const server = express();

// routes
import userRoutes from './src/routes/user.js';
import groupRoutes from './src/routes/group.js';
import itemRoutes from './src/routes/item.js';
import specItemRoutes from './src/routes/specItem.js';
import oauthRoutes from './src/routes/oauth.js';

// middlewares
import { authenticateJwt } from './src/middlewares/authenticate.js';
import pageNotFoundHandler from './src/middlewares/pageNotFoundHandler.js';
import apiErrorHandler from './src/middlewares/apiErrorHandler.js';

server.get('/', (req, res) => {
  res.redirect('/api-doc');
});
// swagger ui
server.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
server.use(morgan('dev'));
// middlewares
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// cors
server.use(cors(corsOptions));

// oauth and user routes
server.use(`/api/${API_VERSION}/oauth`, oauthRoutes);
server.use(`/api/${API_VERSION}`, userRoutes);

// group, item, specItem routes, with JWT authentication middleware
server.use(`/api/${API_VERSION}/groups`, authenticateJwt, [groupRoutes, itemRoutes, specItemRoutes]);

// 404 error handler
server.use(pageNotFoundHandler);

// general error handler
server.use(apiErrorHandler);

server.listen(PORT, () => {
  console.log('Server is running');
});

export default server;
