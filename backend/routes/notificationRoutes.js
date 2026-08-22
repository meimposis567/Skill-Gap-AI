const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationController");

// All routes are protected
router.use(verifyToken);

// GET /api/notifications/:userId
router.get("/:userId", getNotifications);

// PUT /api/notifications/read/:id
router.put("/read/:id", markAsRead);

// DELETE /api/notifications/:id
router.delete("/:id", deleteNotification);

// PUT /api/notifications/read-all/:userId
router.put("/read-all/:userId", markAllRead);

module.exports = router;
