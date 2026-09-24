import { Router } from "express";
import { productFeed } from "./feed.controller";

const router = Router();

router.get("/feed.xml", productFeed);

export default router;