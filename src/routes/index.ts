import { Router } from 'express';
import { AuthRoute } from './auth.Routes';
import { UserRoute} from './user.Routes';
import { ChatRoutes } from './chat.Routes';
import { followRouter } from './followRoute';
import { notificationRoutes } from './notification.Routes';

const router = Router();

router.use('/auth',AuthRoute);
router.use('/user', UserRoute)
router.use('/chat', ChatRoutes)
router.use(followRouter)
router.use('/notification',notificationRoutes)



export default router;
