// controllers/logController.js
import Log from "../models/Log.js";

// GET ALL LOGS (with filtering + pagination)
export const getLogs = async (req, res) => {
  try {
    const { user, action, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (user) filter.user = user;
    if (action) filter.action = action;
    if (status) filter.status = status;

    if (startDate && endDate) {
      filter.createdAt = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const logs = await Log.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Log.countDocuments(filter);

    return res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      logs
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
};


// DELETE ALL LOGS (optional)
export const deleteAllLogs = async (req, res) => {
  try {
    await Log.deleteMany();

    return res.json({ message: "All logs removed" });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete logs" });
  }
};
