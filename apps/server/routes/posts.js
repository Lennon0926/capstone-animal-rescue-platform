const express = require("express");
const router = express.Router();

const {
  getPosts,
  getPostById,
  createPost,
  updatePostById,
  deletePost,
} = require("../repositories/postsRepository");
const {
  validatePostsQuery,
  validatePostId,
  validateCreatePost,
  validateUpdatePost,
} = require("../middleware/validation");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");
const { requireJson } = require("../middleware/requireJson");

router.get(
  "/",
  validatePostsQuery,
  asyncHandler(async (req, res) => {
    const { limit, offset } = req.validatedParams;
    const result = await getPosts({ limit, offset });

    if (result.error) {
      throw new ApiError(500, "Failed to fetch posts", result.error);
    }

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.count,
        limit,
        offset,
        hasMore: offset + result.data.length < result.count,
      },
    });
  })
);

router.get(
  "/:pid",
  validatePostId,
  asyncHandler(async (req, res) => {
    const result = await getPostById(req.params.pid);

    if (result.error === "Post not found") {
      throw new ApiError(404, `Post with ID ${req.params.pid} not found`);
    }

    if (result.error) {
      throw new ApiError(500, "Failed to fetch post", result.error);
    }

    res.json({ success: true, data: result.data });
  })
);

router.post(
  "/",
  requireJson,
  asyncHandler(requireAuth),
  validateCreatePost,
  asyncHandler(async (req, res) => {
    const result = await createPost(req.validatedBody);

    if (result.error) {
      throw new ApiError(500, "Failed to create post", result.error);
    }

    res.status(201).json({ success: true, data: result.data });
  })
);

router.patch(
  "/:pid",
  requireJson,
  asyncHandler(requireAuth),
  validatePostId,
  validateUpdatePost,
  asyncHandler(async (req, res) => {
    const updates = { ...req.validatedBody };
    if (req.body.remove_image === true && !updates.image_object_key) {
      updates.remove_image = true;
    }
    const result = await updatePostById(req.params.pid, updates);

    if (result.error === "Post not found") {
      throw new ApiError(404, `Post with ID ${req.params.pid} not found`);
    }

    if (result.error) {
      throw new ApiError(500, "Failed to update post", result.error);
    }

    res.json({ success: true, data: result.data });
  })
);

router.delete(
  "/:pid",
  asyncHandler(requireAuth),
  validatePostId,
  asyncHandler(async (req, res) => {
    const result = await deletePost(req.params.pid);

    if (result.error === "Post not found") {
      throw new ApiError(404, `Post with ID ${req.params.pid} not found`);
    }

    if (result.error) {
      throw new ApiError(500, "Failed to delete post", result.error);
    }

    res.json({ success: true, data: result.data });
  })
);

module.exports = router;
