import express, { Application, Request, Response } from 'express';
import path from 'path';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.middleware';
import cookieParser from 'cookie-parser';
import router from "./routes";
import { authMiddleware } from './middlewares/auth.middleware';
import passport from './config/passport'
const app: Application = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URI, credentials: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
// app.use(limiter);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(authMiddleware)
app.use(passport.initialize());

app.get('/api/v1', (_, res: Response) => res.json({ success: true, message: 'API is running' }));

app.all('', (_, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use("/api/v1", router)

app.use(errorHandler);

export default app;
