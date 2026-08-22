const getAuthenticatedUserId = (req) => {
  const userId = req.user?.userId;

  if (!userId) {
    return null;
  }

  return typeof userId === "string" ? userId : userId.toString();
};

const ensureCurrentUserAccess = (req, res, requestedUserId) => {
  const authUserId = getAuthenticatedUserId(req);

  if (!authUserId) {
    res.status(401).json({ message: "Unauthorized ❌" });
    return null;
  }

  if (requestedUserId && authUserId !== requestedUserId.toString()) {
    res.status(403).json({ message: "Forbidden ❌" });
    return null;
  }

  return authUserId;
};

module.exports = {
  getAuthenticatedUserId,
  ensureCurrentUserAccess,
};
