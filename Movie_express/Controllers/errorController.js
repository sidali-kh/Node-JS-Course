const CustomError = require("../Utils/customErrorHandler");

const CastError = () => new CustomError('Movie with that ID is not found!', 404);
const ValidationError = () => new CustomError('Validation failed', 400);
const DuplicateKeyError = () => new CustomError('Duplicate key error', 400);
const JWTError = () => new CustomError('Invalid token. Please log in again', 401);
// const JWTExpiredError = () => new CustomError('Your token has expired. Please log in again', 401);


exports.globalErrorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode || 500).json({
        status: 'error',
        error : err,
        message: err.message,
        stack: err.stack
    });
    } else{
    (err.name === 'CastError')? err = CastError() : err = err;
    (err.name === 'ValidationError')? err = ValidationError() : err = err;
    (err.name === 'NotFoundError')? err = NotFoundError() : err = err;
    (err.code === 11000)? err = DuplicateKeyError() : err = err;
    (err.name === 'JsonWebTokenError')? err = JWTError() : err = err;
    if (err instanceof CustomError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    } else {
    res.status(err.statusCode || 500).json({
        status: 'error',
        message:'Something went wrong',
    });
    }
    }
};
