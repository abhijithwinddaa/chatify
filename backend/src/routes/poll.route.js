import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    createPoll,
    getGroupPolls,
    votePoll,
    endPoll,
    deletePoll
} from "../controllers/poll.controller.js";

const router = express.Router();

// Create poll in a group
router.post("/group/:groupId", protectRoute, createPoll);

// Get all polls for a group
router.get("/group/:groupId", protectRoute, getGroupPolls);

// Vote on a poll option
router.post("/:pollId/vote", protectRoute, votePoll);

// End a poll
router.put("/:pollId/end", protectRoute, endPoll);

// Delete a poll
router.delete("/:pollId", protectRoute, deletePoll);

export default router;
