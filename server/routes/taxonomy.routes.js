const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { getCategories, getLocations, getSkills } = require('../utils/taxonomyQueries');

const router = express.Router();

// GET /api/taxonomy/categories — active categories only, no auth required.
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await getCategories();
    return new ApiResponse(200, { categories }, 'Categories retrieved.').send(res);
  })
);

// GET /api/taxonomy/locations — active locations only, no auth required.
router.get(
  '/locations',
  asyncHandler(async (req, res) => {
    const locations = await getLocations();
    return new ApiResponse(200, { locations }, 'Locations retrieved.').send(res);
  })
);

// GET /api/taxonomy/skills — active skills only, no auth required.
router.get(
  '/skills',
  asyncHandler(async (req, res) => {
    const skills = await getSkills();
    return new ApiResponse(200, { skills }, 'Skills retrieved.').send(res);
  })
);

module.exports = router;
