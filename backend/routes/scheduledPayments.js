import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { scheduledPaymentValidation } from '../middleware/validation.js';
import { Account } from '../models/Account.js';
import { ScheduledPayment } from '../models/ScheduledPayment.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const payments = await ScheduledPayment.findByUser(req.user.id);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

router.post('/', scheduledPaymentValidation, async (req, res, next) => {
  try {
    const { account_id, payee_name, payee_iban, amount, frequency, start_date, notes } = req.body;

    const account = await Account.findById(account_id);
    if (!account || account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Account not found or inaccessible' });
    }

    const payment = await ScheduledPayment.create({
      userId: req.user.id,
      accountId: account_id,
      payeeName: payee_name,
      payeeIban: payee_iban,
      amount,
      frequency,
      startDate: start_date,
      notes
    });

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await ScheduledPayment.delete(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Scheduled payment not found' });
    }
    res.json({ message: 'Scheduled payment cancelled', payment: deleted });
  } catch (error) {
    next(error);
  }
});

export default router;
