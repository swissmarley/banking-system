import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// PCI-DSS Password Requirements: min 8 chars, uppercase, lowercase, digit, special char
const validatePCIDSSPassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)';
  }
  return true;
};

export const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password')
    .custom(validatePCIDSSPassword)
    .withMessage('Password must meet PCI-DSS requirements: min 8 characters, uppercase, lowercase, digit, and special character'),
  handleValidationErrors
];

export const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const accountValidation = [
  body('account_type').isIn(['checking', 'savings', 'business']).withMessage('Invalid account type'),
  handleValidationErrors
];

export const transactionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['deposit', 'withdrawal', 'transfer']).withMessage('Invalid transaction type'),
  handleValidationErrors
];

export const depositWithdrawValidation = [
  body('account_id').isInt().withMessage('Invalid account ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  handleValidationErrors
];

export const transferValidation = [
  body('from_account_id').isInt().withMessage('Invalid from account ID'),
  body('to_account_id').isInt().withMessage('Invalid to account ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  handleValidationErrors
];


