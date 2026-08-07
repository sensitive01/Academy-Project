const { body } = require('express-validator');

const publicRegistrationValidation = [
    body('studentNameEnglish').notEmpty().withMessage('Student name in English is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('dob').isDate({ format: 'YYYY-MM-DD' }).withMessage('Valid date of birth is required').optional({ checkFalsy: true }),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('year').notEmpty().withMessage('Year is required'),
];

module.exports = {
    publicRegistrationValidation
};
