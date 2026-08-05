import { Router, type IRouter } from "express";
import healthRouter from "./health";
import farmersRouter from "./farmers";
import plotsRouter from "./plots";
import diagnosisRouter from "./diagnosis";
import soilRouter from "./soil";
import advisoryRouter from "./advisory";
import historyRouter from "./history";
import weatherRouter from "./weather";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(farmersRouter);
router.use(plotsRouter);
router.use(diagnosisRouter);
router.use(soilRouter);
router.use(advisoryRouter);
router.use(historyRouter);
router.use(weatherRouter);
router.use(dashboardRouter);

export default router;
