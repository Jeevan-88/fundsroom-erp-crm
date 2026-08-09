import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import {
    createProductController,
    getProductController,
    listProductsController,
    updateProductController
} from "./product.controller.js";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
    listProductsController
);

router.post(
    "/",
    authorize("ADMIN"),
    createProductController
);

router.get(
    "/:id",
    authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
    getProductController
);

router.put(
    "/:id",
    authorize("ADMIN"),
    updateProductController
);

export default router;