const Notification = require("../models/Notification");
const { ensureCurrentUserAccess, getAuthenticatedUserId } = require("../utils/requestAccess");

// GET /api/notifications/:userId
exports.getNotifications = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(15);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// PUT /api/notifications/read/:id
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized ❌" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found ❌" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
};

// PUT /api/notifications/read-all/:userId
exports.markAllRead = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications" });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized ❌" });
    }

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found ❌" });
    }

    res.json({ message: "Notification deleted successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification", error: error.message });
  }
};
