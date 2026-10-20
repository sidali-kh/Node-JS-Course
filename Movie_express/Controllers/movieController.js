const Movie = require('../Models/movieModel');
const APIFeatures = require('../Utils/ApiFeature');
const asyncErrorHandler = require('../Utils/asyncErrorHandler');
const CustomError = require('./../Utils/customErrorHandler');


exports.getAllMovies = asyncErrorHandler(async (req, res) => {
    const features = new APIFeatures(Movie.find(), req.query);
    const movies = await features.filter().sort().limitFields().paginate().query;

        res.status(200).json({
            status: 'success',
            results: movies.length,
            data: {
                movies
            }
        });
    
});


exports.createMovie = asyncErrorHandler(async (req, res) => {
        const newMovie = await Movie.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                movie: newMovie
            }
        });
    
});

exports.getMovieById = asyncErrorHandler(async (req, res, next) => {
 
    //const movie = await Movie.findOne({_id: req.params.id});
    const movie = await Movie.findById(req.params.id);
    if(!movie) {
        const error = new CustomError('No movie found with that ID', 404);
        return next(error);
    }
    res.status(200).json({
        status: 'success',
        data: {
            movie
        }
    });
})


exports.updateMovie = asyncErrorHandler(async (req, res) => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                movie
            }
        });
});

exports.deleteMovie = asyncErrorHandler(async (req, res) => {
        const movie = await Movie.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null  
        }); 
});