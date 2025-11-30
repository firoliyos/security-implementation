// middleware/accessControl.js
import policies from "../config/policies.js";
import LeaveRequest from "../models/LeaveRequest.js"; // adjust path

// ---------- Helpers ----------
const timeNowHHMM = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const isTimeBetween = (time, start, end) => {
  // times like "09:00"
  return start <= time && time <= end;
};

// ---------- MAC: sensitivity check ----------
/**
 * checkSensitivity(sensitivityField, requiredLevel)
 * sensitivityField: name of field on resource (e.g., "sensitivity" or "classification")
 * requiredLevel: sensitivity required to view/modify (optional)
 */
export const checkSensitivity = (sensitivityField = "sensitivity", requiredLevel = null) => {
  return async (req, res, next) => {
    try {
      const id = req.params.id || req.body.id;
      if (!id) return res.status(400).json({ message: "Resource id required for MAC check" });

      const resource = await LeaveRequest.findById(id).lean();
      if (!resource) return res.status(404).json({ message: "Resource not found" });

      const level = resource[sensitivityField] || "Internal"; // default

      // if requiredLevel specified, ensure resource meets or exceeds it (optional)
      if (requiredLevel && level !== requiredLevel) {
        return res.status(403).json({ message: "Resource sensitivity does not match required level" });
      }

      // consult macViewPolicy
      const allowedRoles = policies.macViewPolicy[level] || [];
      if (allowedRoles.includes(req.user.role)) return next();

      return res.status(403).json({ message: `Access denied by MAC: ${level}` });
    } catch (err) {
      console.error("MAC error:", err);
      return res.status(500).json({ message: "MAC check failed" });
    }
  };
};

// ---------- DAC: owner or allowed-users check ----------
/**
 * checkOwnerOrAllowed(resourceModel, ownerField = "owner", allowedField = "allowedUsers")
 * Example: checkOwnerOrAllowed(LeaveRequest, "employee", "allowedUsers")
 */
export const checkOwnerOrAllowed = (resourceModel, ownerField = "owner", allowedField = "allowedUsers") => {
  return async (req, res, next) => {
    try {
      const id = req.params.id || req.body.id;
      if (!id) return res.status(400).json({ message: "Resource id required for DAC check" });

      const resource = await resourceModel.findById(id).lean();
      if (!resource) return res.status(404).json({ message: "Resource not found" });

      const ownerId = String(resource[ownerField]);
      const userId = req.user.id;

      // owner has full control
      if (ownerId === userId) return next();

      // allowed users array contains user ids who owner granted access to
      const allowed = Array.isArray(resource[allowedField]) ? resource[allowedField].map(id => String(id)) : [];

      if (allowed.includes(userId)) return next();

      return res.status(403).json({ message: "Access denied by DAC: not owner or allowed" });
    } catch (err) {
      console.error("DAC error:", err);
      return res.status(500).json({ message: "DAC check failed" });
    }
  };
};

// ---------- RuBAC: time window / location checks ----------
/**
 * checkWorkingHours() - denies requests outside configured working hours for non-exempt roles
 */
export const checkWorkingHours = (exemptRoles = ["Admin"]) => {
  return (req, res, next) => {
    try {
      const now = timeNowHHMM();
      const { start, end } = policies.workingHours;

      if (exemptRoles.includes(req.user.role)) return next();

      if (isTimeBetween(now, start, end)) return next();

      return res.status(403).json({ message: "Access denied by RuBAC: outside working hours" });
    } catch (err) {
      console.error("RuBAC error:", err);
      return res.status(500).json({ message: "RuBAC check failed" });
    }
  };
};

/**
 * checkLocation(allowedLocations = [])
 */
export const checkLocation = (allowedLocations = []) => (req, res, next) => {
  try {
    if (!allowedLocations || allowedLocations.length === 0) return next();
    if (allowedLocations.includes(req.user.location)) return next();
    return res.status(403).json({ message: "Access denied by RuBAC: location not allowed" });
  } catch (err) {
    console.error("Location check error:", err);
    return res.status(500).json({ message: "Location check failed" });
  }
};

// ---------- ABAC: attribute policy engine ----------
/**
 * checkAttributes(policyObj)
 * policyObj: e.g. { role: "Manager", department: "Finance", timeWindow: {start:"09:00", end:"18:00"} }
 */
export const checkAttributes = (policyObj = {}) => {
  return (req, res, next) => {
    try {
      if (!policyObj || Object.keys(policyObj).length === 0) return next();

      // role check
      if (policyObj.role && req.user.role !== policyObj.role)
        return res.status(403).json({ message: "Access denied by ABAC: role mismatch" });

      // department check
      if (policyObj.department && req.user.department !== policyObj.department)
        return res.status(403).json({ message: "Access denied by ABAC: department mismatch" });

      // location check
      if (policyObj.location && req.user.location !== policyObj.location)
        return res.status(403).json({ message: "Access denied by ABAC: location mismatch" });

      // employmentStatus
      if (policyObj.employmentStatus && req.user.employmentStatus !== policyObj.employmentStatus)
        return res.status(403).json({ message: "Access denied by ABAC: employment status mismatch" });

      // timeWindow: optional
      if (policyObj.timeWindow) {
        const now = timeNowHHMM();
        const { start, end } = policyObj.timeWindow;
        if (!isTimeBetween(now, start, end))
          return res.status(403).json({ message: "Access denied by ABAC: outside allowed time window" });
      }

      return next();
    } catch (err) {
      console.error("ABAC error:", err);
      return res.status(500).json({ message: "ABAC check failed" });
    }
  };
};
