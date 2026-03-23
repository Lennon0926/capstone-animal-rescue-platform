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
  updateAnimalById
} = require("../repositories/animalsRepository");
const { validateAnimalsQuery, validateAnimalId, validateCreateAnimal, validateUpdateAnimal } = require("../middleware/validation");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");

/**
 * @swagger
 * /api/animals:
 *   get:
 *     summary: List animals
 *     description: Retrieves animals with optional filtering, sorting, and pagination
 *     tags: [Animals]
 *     parameters:
 *       - in: query
 *         name: species
 *         schema:
 *           type: string
 *         description: Filter by species (partial match)
 *         example: Dog
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, adopted, pending, fostered, medical_hold]
 *         description: Filter by adoption status
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [small, medium, large, extra_large]
 *         description: Filter by size category
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, unknown]
 *         description: Filter by gender
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by name (partial match)
 *         example: Buddy
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [aid, name, species, status, created_at]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of animals
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnimalListResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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
 * @swagger
 * /api/animals/filters:
 *   get:
 *     summary: Get filter options
 *     description: Returns available filter options for species, status, size, and gender
 *     tags: [Animals]
 *     responses:
 *       200:
 *         description: Available filter options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterOptions'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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

    const errors = [speciesResult, statusResult, sizeResult, genderResult]
      .filter((r) => r.error)
      .map((r) => r.error);

    if (errors.length > 0) {
      throw new ApiError(500, "Failed to fetch filter options", errors.join("; "));
    }

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
 * @swagger
 * /api/animals/{aid}:
 *   get:
 *     summary: Get single animal
 *     description: Retrieves detailed information about a specific animal by ID
 *     tags: [Animals]
 *     parameters:
 *       - in: path
 *         name: aid
 *         required: true
 *         schema:
 *           type: string
 *         description: Animal unique identifier
 *         example: dog-001
 *     responses:
 *       200:
 *         description: Animal details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnimalDetailResponse'
 *       404:
 *         description: Animal not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               success: false
 *               error:
 *                 message: "Animal with ID dog-999 not found"
 *                 code: "NOT_FOUND"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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

/**
 * PATCH /api/animals/:aid
 * Updates an animal by ID.
 */
router.patch(
  "/:aid",
  validateAnimalId,
  validateUpdateAnimal,
  asyncHandler(async (req, res) => {
    const result = await updateAnimalById(req.params.aid, req.validatedBody);

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
