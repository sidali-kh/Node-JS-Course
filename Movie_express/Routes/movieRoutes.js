const movieController = require('../Controllers/movieController');
const authContorller = require('../Controllers/authContorller');
const express = require('express');
const router = express.Router();

router.get('/', movieController.getAllMovies);
router.post('/', movieController.createMovie);


router.get('/:id', movieController.getMovieById);
router.put('/:id', movieController.updateMovie);
router.delete('/:id', authContorller.protect,
                      authContorller.restrictTo('admin'),
                      movieController.deleteMovie);

module.exports = router;