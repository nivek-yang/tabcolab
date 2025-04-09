import 'dotenv/config';

const {
  API_VERSION, PORT, MONGODB_URI_LOCAL, MONGODB_URI_CLOUD, USE_CLOUD_DB, SESSION_SECRET, WHITE_LIST,
} = process.env;

let MONGODB_URI;
if (USE_CLOUD_DB === 'true') {
  MONGODB_URI = MONGODB_URI_CLOUD;
} else {
  MONGODB_URI = MONGODB_URI_LOCAL;
}

const CORS_WHITE_LIST = WHITE_LIST.split(',');

const corsOptions = {
  origin: CORS_WHITE_LIST,
  optionsSuccessStatus: 200,
  credentials: true, // 允許跨來源的 cookie
};

export {
  API_VERSION,
  PORT,
  MONGODB_URI,
  SESSION_SECRET,
  corsOptions,
};
