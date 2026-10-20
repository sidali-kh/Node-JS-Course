const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A movie must have a title'],
    unique: true
  },
  author: {
    type: String,
    required: [ true, 'A movie must have an author']
  },
  releaseYear: {
    type: Number,
    required: [true, 'A movie must have a release year']
  },
  genre: {
    type: [String],
    required: [true, 'A movie must have a genre'],
    enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance']
  },
  duration : {
    type: Number,
  },
  rating: {
    type: Number,
    default: 0,
    min: [ 0, 'Rating must be above 0'],
    max: [ 5, 'Rating must be below 5']
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  price: {
    type: Number,
    min: [ 0, 'Price must be above 0']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    select: false
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    select: false
  },
//   reviews: [
//     // array of review ids
//     {
//       type: mongoose.Schema.ObjectId,
//       ref: 'Review'
//     }
//   ],
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ech movie will have a virtual field called reviews which will be an array of all reviews for that movie
// foreignField is the field in the Review model that references the Movie model
// localField is the field in the Movie model that is referenced by the Review model
// ref is the name of the model that we are referencing
// movieSchema.virtual('reviews', {
//   ref: 'Review',
//   foreignField: 'movie',
//   localField: '_id'
// });

movieSchema.virtual('durationInHours').get(function(){
    return this.duration / 60;
})


// movieSchema.pre('save', function(next) {
//     console.log('Movie is about to be saved');
//     console.log('This points to the document being saved: ', this);
// //   this.updatedAt = Date.now();
//   next();
// });

// movieSchema.pre('findOneAndUpdate', function(next) {
//   console.log('Movie is about to be updated');
//   console.log('This points to the document being updated: ', this._update);
//   this._update.updatedAt = Date.now();
//   next();
// });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;