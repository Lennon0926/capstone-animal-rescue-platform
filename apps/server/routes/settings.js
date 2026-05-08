const { Router } = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");
const { getSetting, setSetting } = require("../repositories/settingsRepository");

const router = Router();

router.get("/pinned-fb-post", asyncHandler(async (_req, res) => {
  const value = await getSetting("pinned_fb_post_id");
  res.json({ pinnedFbPostId: value });
}));

router.put("/pinned-fb-post", asyncHandler(requireAuth), asyncHandler(async (req, res) => {
  const { postId } = req.body ?? {};
  const value = postId != null ? String(postId) : null;
  await setSetting("pinned_fb_post_id", value);
  res.json({ success: true, pinnedFbPostId: value });
}));

module.exports = router;
