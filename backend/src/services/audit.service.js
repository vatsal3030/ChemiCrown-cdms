const prisma = require('../config/prisma');

/**
 * Log an action to the AuditLog table
 * @param {Object} params
 * @param {string} params.userId - The ID of the user performing the action
 * @param {string} params.action - A short string describing the action (e.g. "CREATED_LOT", "UPDATED_INVENTORY")
 * @param {string} params.entity - The name of the entity being acted upon (e.g. "Lot", "Inventory")
 * @param {string} params.entityId - The ID of the specific entity being acted upon
 * @param {Object} [params.details] - Optional JSON object with more details (e.g. previous state, new state)
 */
async function logAudit({ userId, action, entity, entityId, details }) {
  try {
    if (!userId) {
      console.warn('AuditLog: missing userId. Skipping audit log.', { action, entity, entityId });
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('AuditLog Error: Failed to save audit log', error);
  }
}

module.exports = {
  logAudit,
};
