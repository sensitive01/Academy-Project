const { body } = require('express-validator');

const googleAuthValidation = [
    body('token').notEmpty().withMessage('Google token is required')
];

const sendOtpValidation = [
    body('email').isEmail().withMessage('Valid email is required')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
    googleAuthValidation,
    sendOtpValidation,
    loginValidation
};
