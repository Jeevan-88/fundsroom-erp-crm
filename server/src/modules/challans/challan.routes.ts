import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import {
    cancelChallanController,
    confirmChallanController,
    createChallanController,
    getChallanController,
    listChallansController,
    updateChallanController
} from "./challan.controller.js";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
    listChallansController
);

router.post(
    "/",
    authorize("ADMIN", "SALES"),
    createChallanController
);

router.get(
    "/:id",
    authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
    getChallanController
);

router.put(
    "/:id",
    authorize("ADMIN", "SALES"),
    updateChallanController
);

router.post(
    "/:id/confirm",
    authorize("ADMIN", "SALES"),
    confirmChallanController
);

router.post(
    "/:id/cancel",
    authorize("ADMIN", "SALES"),
    cancelChallanController
);

export const challanRoutes = router;
export default router;