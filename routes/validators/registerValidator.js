const {check} = require('express-validator')

module.exports = [
    check('email')
    .exists().withMessage('Please provide a valid email address')
    .notEmpty().withMessage('Email field was not provided')
    .isEmail().withMessage('Invalid email address'),

    check('phone')
    .exists().withMessage('Please provide a phone number')
    .notEmpty().withMessage('Phone number was not provided')
    .isLength({min:10}).withMessage('Phone number must have 10 characters'),

    check('password')
    .exists().withMessage('Please provide a password')
    .notEmpty().withMessage('Password was not provided')
    .isLength({min:6}).withMessage('Password must be at least 6 characters'),

    check('repassword')
    .exists().withMessage('Please provide a re password')
    .notEmpty().withMessage('Re Password was not provided')
    .custom((value, {req})=>{
        if(value !== req.body.password){
            throw new Error('Password was not fixed')
        }
        return true
    })
]