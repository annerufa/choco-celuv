const router = require('express').Router();
const { getAllRecipes, getActiveRecipes, createRecipe, updateRecipe, statusRecipe } = require('../controllers/recipeController');
const auth = require('../middleware/authenticate');
router.use(auth); // Semua route di sini butuh autentikasi

router.get('/', getAllRecipes);
router.get('/active', getActiveRecipes);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.patch('/:id/status', statusRecipe);

module.exports = router;