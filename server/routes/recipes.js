const router = require('express').Router();
const { getAllRecipes, getActiveRecipes, makeAdonan, createRecipe, updateRecipe, statusRecipe } = require('../controllers/recipeController');
const auth = require('../middleware/authenticate');
router.use(auth); // Semua route di sini butuh autentikasi

router.get('/', getAllRecipes);
router.get('/active', auth, getActiveRecipes);
router.post('/make', auth, makeAdonan);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.patch('/:id/status', statusRecipe);

module.exports = router;