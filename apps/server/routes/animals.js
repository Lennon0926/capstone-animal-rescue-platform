/**
 * Animals API Routes
 * Handles all animal-related API endpoints.
 */

const express = require("express");
const router = express.Router();

const {
  getAnimals,
  getAnimalById,
  getFilterOptions,
  createAnimalWithInitialMedicalRecords,
  deleteAnimal,
  updateAnimalWithMedicalRecordsById
} = require("../repositories/animalsRepository");
const { validateAnimalsQuery, validateAnimalId, validateCreateAnimal, validateUpdateAnimal } = require("../middleware/validation");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");

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
 * - tags: Filter by tag (exact match within tags array)
 * - search: Combined search by name OR tags (partial match)
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
    const { data, error } = await getFilterOptions();

    if (error) {
      throw new ApiError(500, "Failed to fetch filter options", error);
    }

    res.json({
      success: true,
      data,
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
  asyncHandler(requireAuth),
  validateCreateAnimal,
  asyncHandler(async (req, res) => {
    const result = await createAnimalWithInitialMedicalRecords(req.validatedBody);

    if (result.error) {
      throw new ApiError(500, "Failed to create animal", result.error);
    }

    const response = {
      success: true,
      data: result.data,
      medicalRecordsAttempted: result.medicalRecordsAttempted,
      medicalRecordsRequested: result.medicalRecordsRequested,
      medicalRecordsCreatedCount: result.medicalRecordsCreatedCount,
      medicalRecordCreated: result.medicalRecordCreated,
    };

    if (result.warnings.length > 0) {
      response.warnings = result.warnings;
    }

    res.status(201).json(response);
  })
);

/**
 * DELETE /api/animals/:aid
 * Deletes an animal by ID.
 */
router.delete(
  "/:aid",
  asyncHandler(requireAuth),
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

/**
 * PATCH /api/animals/:aid
 * Updates an animal by ID.
 */
router.patch(
  "/:aid",
  asyncHandler(requireAuth),
  validateAnimalId,
  validateUpdateAnimal,
  asyncHandler(async (req, res) => {
    const result = await updateAnimalWithMedicalRecordsById(
      req.params.aid,
      req.validatedBody
    );

    if (result.error === "Animal not found") {
      throw new ApiError(404, `Animal with ID ${req.params.aid} not found`);
    }

    if (result.error) {
      throw new ApiError(500, "Failed to update animal", result.error);
    }

    res.json({
      success: true,
      data: result.data,
    });
  })
);

module.exports = router;
