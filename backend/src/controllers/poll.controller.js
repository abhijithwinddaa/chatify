import Poll from "../models/Poll.js";
import Group from "../models/Group.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Create a new poll in a group
export const createPoll = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { question, options, allowMultipleVotes, isAnonymous, endsAt } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!question || !options || options.length < 2) {
            return res.status(400).json({ message: "Question and at least 2 options are required" });
        }

        if (options.length > 10) {
            return res.status(400).json({ message: "Maximum 10 options allowed" });
        }

        // Verify user is a member of the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.includes(userId)) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        // Create poll with formatted options
        const poll = await Poll.create({
            groupId,
            createdBy: userId,
            question,
            options: options.map(opt => ({
                text: typeof opt === 'string' ? opt : opt.text,
                votes: []
            })),
            allowMultipleVotes: allowMultipleVotes || false,
            isAnonymous: isAnonymous || false,
            endsAt: endsAt ? new Date(endsAt) : null,
        });

        // Populate creator info
        await poll.populate("createdBy", "fullName profilePic");

        // Notify all group members via socket
        group.members.forEach(memberId => {
            if (memberId.toString() !== userId.toString()) {
                const socketId = getReceiverSocketId(memberId);
                if (socketId) {
                    io.to(socketId).emit("newPoll", { groupId, poll });
                }
            }
        });

        res.status(201).json(poll);
    } catch (error) {
        console.error("Error creating poll:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all polls for a group
export const getGroupPolls = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        // Verify user is a member
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const polls = await Poll.find({ groupId })
            .populate("createdBy", "fullName profilePic")
            .sort({ createdAt: -1 });

        res.status(200).json(polls);
    } catch (error) {
        console.error("Error fetching polls:", error);
        res.status(500).json({ message: error.message });
    }
};

// Vote on a poll
export const votePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user._id;

        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ message: "Poll not found" });
        }

        // Check if poll has ended
        if (poll.isEnded || (poll.endsAt && new Date() > poll.endsAt)) {
            return res.status(400).json({ message: "This poll has ended" });
        }

        // Validate option index
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ message: "Invalid option" });
        }

        // Verify user is in the group
        const group = await Group.findById(poll.groupId);
        if (!group || !group.members.includes(userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Check if user already voted on this option (toggle vote)
        const optionVotes = poll.options[optionIndex].votes;
        const existingVoteIndex = optionVotes.findIndex(v => v.toString() === userId.toString());

        if (existingVoteIndex !== -1) {
            // Remove vote (toggle off)
            optionVotes.splice(existingVoteIndex, 1);
            poll.totalVotes = Math.max(0, poll.totalVotes - 1);
        } else {
            // If not allowing multiple votes, remove vote from other options first
            if (!poll.allowMultipleVotes) {
                poll.options.forEach((opt, idx) => {
                    const voteIdx = opt.votes.findIndex(v => v.toString() === userId.toString());
                    if (voteIdx !== -1) {
                        opt.votes.splice(voteIdx, 1);
                        poll.totalVotes = Math.max(0, poll.totalVotes - 1);
                    }
                });
            }
            // Add new vote
            optionVotes.push(userId);
            poll.totalVotes += 1;
        }

        await poll.save();

        // Populate and return updated poll
        await poll.populate("createdBy", "fullName profilePic");

        // Notify group members of vote update
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("pollUpdated", { groupId: poll.groupId, poll });
            }
        });

        res.status(200).json(poll);
    } catch (error) {
        console.error("Error voting on poll:", error);
        res.status(500).json({ message: error.message });
    }
};

// End a poll (only creator or admin can do this)
export const endPoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const userId = req.user._id;

        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ message: "Poll not found" });
        }

        // Verify user is creator or group admin
        const group = await Group.findById(poll.groupId);
        const isCreator = poll.createdBy.toString() === userId.toString();
        const isAdmin = group.admin.toString() === userId.toString();

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: "Only poll creator or group admin can end this poll" });
        }

        poll.isEnded = true;
        poll.endedAt = new Date();
        await poll.save();

        await poll.populate("createdBy", "fullName profilePic");

        // Notify group members
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("pollEnded", { groupId: poll.groupId, poll });
            }
        });

        res.status(200).json(poll);
    } catch (error) {
        console.error("Error ending poll:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a poll
export const deletePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const userId = req.user._id;

        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ message: "Poll not found" });
        }

        // Verify user is creator or group admin
        const group = await Group.findById(poll.groupId);
        const isCreator = poll.createdBy.toString() === userId.toString();
        const isAdmin = group.admin.toString() === userId.toString();

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: "Only poll creator or group admin can delete this poll" });
        }

        await Poll.findByIdAndDelete(pollId);

        // Notify group members
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("pollDeleted", { groupId: poll.groupId, pollId });
            }
        });

        res.status(200).json({ message: "Poll deleted successfully" });
    } catch (error) {
        console.error("Error deleting poll:", error);
        res.status(500).json({ message: error.message });
    }
};
