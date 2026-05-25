const express = require('express');
const router = express.Router();
// const purchase = require('../controllers/purchaseController');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getComponents, addComponent, updateComponent, deleteComponent } = require('../controllers/productsController');
const auth = require('../middleware/authenticate');

router.get('/', auth, getProducts);           // GET    /api/products
router.get('/:id', auth, getProductById);        // GET    /api/products/:id
router.post('/', auth, createProduct);         // POST   /api/products
router.put('/:id', auth, updateProduct);         // PUT    /api/products/:id
router.delete('/:id', auth, deleteProduct);         // DELETE /api/products/:id

// components
router.get('/:id/components', auth, getComponents);     // GET    /api/products/:id/components
router.post('/:id/components', auth, addComponent);      // POST   /api/products/:id/components
router.put('/:id/components/:item_id/:applies_to', auth, updateComponent); // PUT
router.delete('/:id/components/:item_id/:applies_to', auth, deleteComponent); // DELETE


module.exports = router;