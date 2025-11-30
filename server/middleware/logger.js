// middleware/logger.js
import Log from "../models/Log.js";

export const createLog = async ({ userId, action, status, ip, details }) => {
  try {
    await Log.create({
      user: userId || null,
      action,
      status,
      ip,
      details
    });
  } catch (err) {
    console.error("Failed to save log:", err);
  }
};

// Express middleware to log every request
export const logRequest = (actionName) => {
  return async (req, res, next) => {
    req._logAction = actionName;
    next();
  };
};

// Final responder (hook)
export const logResponse = async (req, res, next) => {
  const oldSend = res.send;

  res.send = async function (data) {
    try {
      await createLog({
        userId: req.user?.id,
        action: req._logAction || "UNKNOWN_ACTION",
        status: res.statusCode >= 400 ? "FAILED" : "SUCCESS",
        ip: req.ip,
        details: { url: req.originalUrl }
      });
    } catch (e) {
      console.error("Response log error:", e);
    }

    oldSend.apply(res, arguments);
  };

  next();
};
