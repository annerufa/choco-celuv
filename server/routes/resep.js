const router = require('express').Router();
const { getAllRecipes, createRecipe, updateRecipe, statusRecipe } = require('../controllers/recipeController');

router.get('/', getAllRecipes);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.patch('/:id/status', statusRecipe);

module.exports = router;