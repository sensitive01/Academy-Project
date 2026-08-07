const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Format errors to a simple object { field: 'Message' }
        const formattedErrors = {};
        errors.array().forEach(err => {
            if (!formattedErrors[err.path]) {
                formattedErrors[err.path] = err.msg;
            }
        });
        
        return res.status(400).json({ 
            success: false, 
            message: 'Validation failed', 
            errors: formattedErrors 
        });
    }
    next();
};

module.exports = { validate };
