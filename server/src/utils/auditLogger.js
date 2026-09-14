const AuditLog = require("../models/AuditLog");

/**
 * Standardized Non-Blocking Audit Logger for CareSprint Security Events
 */
const logAuditAction = async ({
  userId = null,
  role = "SYSTEM",
  action,
  resource,
  resourceId = null,
  metadata = {},
  ipAddress = null,
}) => {
  try {
    if (!action || !resource) {
      console.warn("[AuditLogger] Missing action or resource parameter, skipping log.");
      return null;
    }

    const logEntry = await AuditLog.create({
      userId,
      actor: userId,
      role,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress,
    });

    console.log(`[AUDIT] Action: ${action} | Resource: ${resource} | Actor: ${userId || "SYSTEM"}`);
    return logEntry;
  } catch (err) {
    console.error("[AuditLogger Warning] Non-critical audit log creation error:", err.message);
    return null;
  }
};

module.exports = {
  logAuditAction,
};
