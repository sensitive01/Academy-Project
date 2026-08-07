const { body } = require('express-validator');

const createExpenseValidation = [
    body('title').notEmpty().withMessage('Expense title is required').isLength({ max: 100 }).withMessage('Title too long'),
    body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 0 }).withMessage('Amount cannot be negative'),
    body('category').notEmpty().withMessage('Category is required'),
];

module.exports = {
    createExpenseValidation
};
