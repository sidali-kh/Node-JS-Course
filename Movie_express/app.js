const express = require('express');
const morgan = require('morgan');
const movieRoutes = require('./Routes/movieRoutes');
const userRoutes = require('./Routes/userRoutes');
// const CustomError = require('./Utils/customErrorHandler');
const {globalErrorHandler}  = require('./Controllers/errorController');

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(express.json());

app.use(express.static(`Public`));

// app.use((req, res, next) => {
//     console.log('Hello from the middleware');
//     const error = new CustomError('This is a test error', 404);
//     next(error);
// });

app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/users', userRoutes);

app.use(globalErrorHandler);

module.exports = app;