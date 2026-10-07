import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tarotRouter from "./tarot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tarotRouter);

export default router;
