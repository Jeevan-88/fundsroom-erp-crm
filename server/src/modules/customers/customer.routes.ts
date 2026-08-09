import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import {
    createCustomerController,
    createFollowUpController,
    getCustomerController,
    listCustomersController,
    updateCustomerController
} from "./customer.controller.js";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
    listCustomersController
);

router.post(
    "/",
    authorize("ADMIN", "SALES"),
    createCustomerController
);

router.get(
    "/:id",
    authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
    getCustomerController
);

router.put(
    "/:id",
    authorize("ADMIN", "SALES"),
    updateCustomerController
);

router.post(
    "/:id/followups",
    authorize("ADMIN", "SALES"),
    createFollowUpController
);

export default router;