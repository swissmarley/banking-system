import express from 'express';
import { Account } from '../models/Account.js';
import { authenticateToken } from '../middleware/auth.js';
import { accountValidation } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts for current user
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts
 */
router.get('/', async (req, res, next) => {
  try {
    const accounts = await Account.findByUserId(req.user.id);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_type
 *             properties:
 *               account_type:
 *                 type: string
 *                 enum: [checking, savings, business]
 *     responses:
 *       201:
 *         description: Account created successfully
 */
router.post('/', accountValidation, async (req, res, next) => {
  try {
    const { account_type } = req.body;
    const account = await Account.create(req.user.id, account_type);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account details
 *       404:
 *         description: Account not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(account);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       404:
 *         description: Account not found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (parseFloat(account.balance) > 0) {
      return res.status(400).json({ error: 'Cannot delete account with balance' });
    }
    
    const deleted = await Account.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Account deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;




