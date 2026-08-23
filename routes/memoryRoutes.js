import express from "express";
import {
  getMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
  uploadMedia,
} from "../controller/memoryController.js";
import { requireAnyAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAnyAuth);

router.route("/")
  .get(getMemories)
  .post(createMemory);

router.post("/media", uploadMedia);

router.route("/:id")
  .get(getMemoryById)
  .patch(updateMemory)
  .delete(deleteMemory);

export default router;
