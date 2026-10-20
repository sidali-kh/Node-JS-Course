require('dotenv').config({ path: './config.env' });

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Movie = require('../Models/movieModel');

mongoose.connect(process.env.LOCAL_CONN_STR)
  .then(() => console.log('DB connected'));

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance'];

const generateMovie = () => {
  return {
    title: faker.lorem.words(3) + faker.string.alphanumeric(5), // ensure uniqueness
    author: faker.person.fullName(),
    releaseYear: faker.number.int({ min: 1980, max: 2025 }),
    genre: faker.helpers.arrayElement(genres),
    duration: faker.number.int({ min: 80, max: 180 }),
    rating: faker.number.float({ min: 0, max: 5, precision: 0.1 }),
    description: faker.lorem.paragraph(),
    image: faker.image.urlPicsumPhotos(),
    price: faker.number.float({ min: 5, max: 30, precision: 0.01 })
  };
};

const seedMovies = async () => {
  try {
    await Movie.deleteMany(); // clear old data

    const movies = Array.from({ length: 50 }, generateMovie);

    await Movie.insertMany(movies);

    console.log('50 movies inserted successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedMovies();