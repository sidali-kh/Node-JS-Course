const User = require('../Models/userModel');
const asyncErrorHandler = require('../Utils/asyncErrorHandler');
const jwt = require('jsonwebtoken'); 
const CustomError = require('./../Utils/customErrorHandler');
const crypto = require('crypto');
const Email = require('./../Utils/email');

// Sign JWT
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields[0].includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.signup = asyncErrorHandler(async (req, res) => {
    // Create new user & send JWT
    const newUser = await User.create(req.body);
    const token = signToken(newUser._id);

    res.status(200).json({
        status: 'success',
        message: 'User signed up successfully',
        token,
        data: {
            user: newUser,
        }
    });
});

exports.login = asyncErrorHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    const user = await User.findOne({ email }).select('+password');

    // 2) Check if password is correct
    if (!user || !(await user.comparePassword(password, user.password))) {
        const error = new CustomError('Incorrect email or password', 401);
        return next(error);
    }

    // 3) Send token to client
    const token = signToken(user._id);
    const options = {
        maxAge: process.env.JWT_COOKIE_EXPIRES_IN,
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    res.cookie('jwt', token, options);
    res.status(200).json({
        status: 'success',
        token,
        data: {
            user,
        }
    });
});

exports.protect = asyncErrorHandler(async (req, res, next) => {
    let token;
    // 1) Getting token and check if it's there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2) Check if token is there
    if (!token) {
        const error = new CustomError('You are not logged in! Please log in to get access.', 401);
        return next(error);
    }

    // 3) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        const error = new CustomError('The user belonging to this token does no longer exist.', 401);
        return next(error);
    }

    // 5) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        const error = new CustomError('User recently changed password! Please log in again.', 401);
        return next(error);
    }

    // 6) Grant access to protected route
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            const error = new CustomError('You do not have permission to perform this action', 403);
            return next(error);
        }
        next();
    }
};

exports.forgotPassword = asyncErrorHandler(async (req, res) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        const error = new CustomError('There is no user with email address', 404);
        return next(error);
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    Email.sendEmail({
        email: req.body.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        message: `Forgot your password? Submit a PATCH request with
        your new password and passwordConfirm to:
        ${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}. 
        // \nIf you didn't forget your password, please ignore this email!`
    });

    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    });
});


exports.resetPassword = asyncErrorHandler(async (req, res) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256')
                              .update(req.params.token)
                              .digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken,
                                      passwordResetExpires: { $gt: Date.now() } });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        const error = new CustomError('Token is invalid or has expired', 400);
        return next(error);
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    // 3) Log the user in, send JWT
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});

exports.updatePassword = asyncErrorHandler(async (req, res) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.comparePassword(req.body.passwordCurrent, user.password))) {
        const error = new CustomError('Your current password is wrong.', 400);
        return next(error);
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordChangedAt = Date.now();
    await user.save();

    // 4) Log user in, send JWT
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});

exports.updateMe = asyncErrorHandler(async (req, res) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        const error = new CustomError('This route is not for password updates. Please use /update-password.', 400);
        return next(error);
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, Object.keys(req.body));

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = asyncErrorHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.uploadPhoto = asyncErrorHandler(async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            photo: req.file.filename
        }
    });
});

exports.getMe = asyncErrorHandler(async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});

exports.getAllUsers = asyncErrorHandler(async (req, res) => {
    // remove users with active: false from results
    const users = await User.find({ active: true });
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});