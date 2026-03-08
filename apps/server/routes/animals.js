/**
 * Animals API Routes
 * Handles all animal-related API endpoints.
 */

const express = require("express");
const router = express.Router();

const {
  getAnimals,
  getAnimalById,
  getDistinctValues,
  createAnimal,
  deleteAnimal,
} = require("../repositories/animalsRepository");
const { validateAnimalsQuery, validateAnimalId, validateCreateAnimal } = require("../middleware/validation");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");

/**
 * GET /api/animals
 * Retrieves animals with optional filtering, sorting, and pagination.
 *
 * Query Parameters:
 * - species: Filter by species (partial match)
 * - status: Filter by status (available, adopted, pending, fostered, medical_hold)
 * - size: Filter by size (small, medium, large, extra_large)
 * - gender: Filter by gender (male, female, unknown)
 * - name: Search by name (partial match)
 * - sortBy: Sort field (aid, name, species, status, created_at)
 * - sortOrder: Sort direction (asc, desc)
 * - limit: Number of records (1-100, default: 50)
 * - offset: Records to skip (default: 0)
 */
router.get(
  "/",
  validateAnimalsQuery,
  asyncHandler(async (req, res) => {
    const { filters, limit, offset, sortBy, sortOrder } = req.validatedParams;

    const result = await getAnimals({
      filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    if (result.error) {
      throw new ApiError(500, "Failed to fetch animals", result.error);
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

/**
 * GET /api/animals/filters
 * Returns available filter options for the animals list.
 */
router.get(
  "/filters",
  asyncHandler(async (req, res) => {
    const [speciesResult, statusResult, sizeResult, genderResult] = await Promise.all([
      getDistinctValues("species"),
      getDistinctValues("status"),
      getDistinctValues("size"),
      getDistinctValues("gender"),
    ]);

    res.json({
      success: true,
      data: {
        species: speciesResult.data,
        status: statusResult.data,
        size: sizeResult.data,
        gender: genderResult.data,
      },
    });
  })
);

/**
 * GET /api/animals/:aid
 * Retrieves a single animal by ID.
 */
router.get(
  "/:aid",
  validateAnimalId,
  asyncHandler(async (req, res) => {
    const result = await getAnimalById(req.params.aid);

    if (result.error === "Animal not found") {
      throw new ApiError(404, `Animal with ID ${req.params.aid} not found`);
    }

    if (result.error) {
      throw new ApiError(500, "Failed to fetch animal", result.error);
    }

    res.json({
      success: true,
      data: result.data,
    });
  })
);

/**
 * POST /api/animals
 * Creates a new animal.
 */
router.post(
  "/",
  validateCreateAnimal,
  asyncHandler(async (req, res) => {
    const result = await createAnimal(req.validatedBody);

    if (result.error) {
      throw new ApiError(500, "Failed to create animal", result.error);
    }

    res.status(201).json({
      success: true,
      data: result.data,
    });
  })
);

/**
 * DELETE /api/animals/:aid
 * Deletes an animal by ID.
 */
router.delete(
  "/:aid",
  validateAnimalId,
  asyncHandler(async (req, res) => {
    const result = await deleteAnimal(req.params.aid);

    if (result.error === "Animal not found") {
      throw new ApiError(404, `Animal with ID ${req.params.aid} not found`);
    }

    if (result.error) {
      throw new ApiError(500, "Failed to delete animal", result.error);
    }

    res.json({
      success: true,
      data: result.data,
    });
  })
);

module.exports = router;
