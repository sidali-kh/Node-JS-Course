const authContorller = require('../Controllers/authContorller');
const express = require('express');
const router = express.Router();


router.post('/signup', authContorller.signup);
router.post('/login', authContorller.login);
router.post('/forgot-password', authContorller.forgotPassword);
router.patch('/reset-password/:token', authContorller.resetPassword);
router.patch('/update-password',authContorller.protect, authContorller.updatePassword);

router.get('/me', authContorller.protect, authContorller.getMe);
router.patch('/update-me', authContorller.protect, authContorller.updateMe);
router.delete('/delete-me', authContorller.protect, authContorller.deleteMe);

router.get('/', authContorller.protect,
                authContorller.restrictTo('admin'),
                authContorller.getAllUsers);

module.exports = router;