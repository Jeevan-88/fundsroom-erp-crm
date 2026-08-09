import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import {
    createStockMovementController,
    listStockMovementsController
} from "./stock.controller.js";

const router = Router();

router.use(authenticate);

router.get(
    "/movements",
    authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
    listStockMovementsController
);

router.post(
    "/movements",
    authorize("ADMIN", "WAREHOUSE"),
    createStockMovementController
);

export default router;