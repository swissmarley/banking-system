import express from 'express';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';

const router = express.Router();

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildViewModel = (overrides = {}) => ({
  form: {
    senderName: '',
    senderEmail: '',
    iban: '',
    amount: '',
    reference: '',
    ...overrides.form
  },
  errors: overrides.errors || [],
  success: overrides.success || null,
  recentAccount: overrides.recentAccount || null
});

const renderTemplate = (model) => {
  const { form, errors, success, recentAccount } = model;
  const requiredParams = [
    { label: 'Sender full name', tip: 'Needed for compliance and tracing obligations.' },
    { label: 'Contact email', tip: 'Used to send the payment receipt.' },
    { label: 'Destination IBAN', tip: 'Must exist inside this banking system.' },
    { label: 'Amount', tip: 'Minimum 0.01 in your account currency.' },
    { label: 'Payment reference', tip: 'Optional description for the account owner.' }
  ];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Send Payment | Banking System</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        --bg: #0b1320;
        --card: rgba(14, 22, 39, 0.85);
        --accent: #5ad8ff;
        --accent-strong: #3d8bff;
        --text: #f7f9ff;
        --muted: rgba(247, 249, 255, 0.7);
        --danger: #ff6b81;
        --success: #5ad3a2;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: radial-gradient(circle at top, #13203d, #05070c 65%);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }
      .portal {
        width: min(960px, 100%);
        background: var(--card);
        border-radius: 24px;
        padding: 2.5rem;
        box-shadow: 0 40px 80px rgba(0,0,0,0.45);
        backdrop-filter: blur(20px);
      }
      h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(2rem, 3vw, 2.6rem);
      }
      p.lead {
        margin: 0 0 1.5rem;
        color: var(--muted);
      }
      form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      label {
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      input, textarea {
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.15);
        padding: 0.95rem 1.1rem;
        font-size: 1rem;
        color: var(--text);
        background: rgba(255,255,255,0.04);
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      input:focus, textarea:focus {
        border-color: var(--accent);
        outline: none;
        box-shadow: 0 0 0 2px rgba(90, 216, 255, 0.25);
      }
      textarea {
        resize: vertical;
        min-height: 110px;
      }
      .full-width {
        grid-column: 1 / -1;
      }
      .actions {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      button {
        border: none;
        border-radius: 999px;
        padding: 0.95rem 2.5rem;
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(120deg, var(--accent-strong), var(--accent));
        color: #041222;
        box-shadow: 0 20px 35px rgba(61, 139, 255, 0.35);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 25px 40px rgba(61, 139, 255, 0.45);
      }
      ul.params {
        list-style: none;
        padding: 0;
        margin: 0 0 2rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
      }
      ul.params li {
        background: rgba(255,255,255,0.04);
        border-radius: 14px;
        padding: 0.85rem 1rem;
        font-size: 0.95rem;
        color: var(--muted);
      }
      ul.params strong {
        color: var(--text);
        display: block;
      }
      .alert {
        padding: 1rem 1.25rem;
        border-radius: 14px;
        margin-bottom: 1.25rem;
      }
      .alert.error {
        background: rgba(255,107,129,0.15);
        border: 1px solid rgba(255,107,129,0.4);
      }
      .alert.success {
        background: rgba(90,211,162,0.15);
        border: 1px solid rgba(90,211,162,0.45);
      }
      .recent-card {
        margin-top: 1.25rem;
        padding: 1.25rem;
        border-radius: 16px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
      }
      .recent-card dl {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
        margin: 0;
      }
      .recent-card dt {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .recent-card dd {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
      }
      @media (max-width: 768px) {
        body { padding: 1rem; }
        .portal { padding: 1.5rem; }
        form { grid-template-columns: 1fr; }
        .actions { flex-direction: column; align-items: stretch; }
        button { width: 100%; }
      }
    </style>
  </head>
  <body>
    <section class="portal">
      <header>
        <h1>Instant Payment Portal</h1>
        <p class="lead">Securely send money from any bank to an internal Banking System account via its IBAN.</p>
      </header>
      <ul class="params">
        ${requiredParams
          .map(
            (param) =>
              `<li><strong>${param.label}</strong>${param.tip}</li>`
          )
          .join('')}
      </ul>
      ${errors.length ? `<div class="alert error"><strong>We could not start your payment:</strong><ul>${errors
        .map((err) => `<li>${escapeHtml(err)}</li>`)
        .join('')}</ul></div>` : ''}
      ${success ? `<div class="alert success">${escapeHtml(success)}</div>` : ''}
      <form method="POST" novalidate>
        <div class="form-group">
          <label for="senderName">Sender full name *</label>
          <input id="senderName" name="senderName" required value="${escapeHtml(form.senderName)}" placeholder="Jane Doe" />
        </div>
        <div class="form-group">
          <label for="senderEmail">Contact email *</label>
          <input id="senderEmail" name="senderEmail" type="email" required value="${escapeHtml(form.senderEmail)}" placeholder="jane.doe@email.com" />
        </div>
        <div class="form-group">
          <label for="iban">Destination IBAN *</label>
          <input id="iban" name="iban" required value="${escapeHtml(form.iban)}" placeholder="DE89 3704 0044 0532 0130 00" />
        </div>
        <div class="form-group">
          <label for="amount">Amount *</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required value="${escapeHtml(form.amount)}" placeholder="150.00" />
        </div>
        <div class="form-group full-width">
          <label for="reference">Payment reference</label>
          <textarea id="reference" name="reference" placeholder="Let the account owner know what this payment is for.">${escapeHtml(form.reference)}</textarea>
        </div>
        <div class="actions">
          <button type="submit">Send secure payment</button>
          <span>Funds post immediately to the matching account.</span>
        </div>
      </form>
      ${
        recentAccount
          ? `<div class="recent-card">
              <strong>Latest transfer summary</strong>
              <dl>
                <div>
                  <dt>Destination IBAN</dt>
                  <dd>${escapeHtml(recentAccount.iban)}</dd>
                </div>
                <div>
                  <dt>Internal account</dt>
                  <dd>${escapeHtml(recentAccount.account_number)}</dd>
                </div>
                <div>
                  <dt>Amount received</dt>
                  <dd>$${escapeHtml(recentAccount.amount)}</dd>
                </div>
                <div>
                  <dt>New balance</dt>
                  <dd>$${escapeHtml(recentAccount.balance)}</dd>
                </div>
              </dl>
            </div>`
          : ''
      }
    </section>
  </body>
</html>`;
};

router.get('/', (req, res) => {
  res.type('html').send(renderTemplate(buildViewModel()));
});

router.post('/', async (req, res) => {
  const { senderName, senderEmail, iban, amount, reference } = req.body || {};
  const errors = [];

  const trimmedName = senderName?.trim();
  const trimmedEmail = senderEmail?.trim();
  const normalizedIban = iban?.replace(/\s+/g, '').toUpperCase();
  const rawAmount = Number.parseFloat(amount);

  if (!trimmedName) {
    errors.push('Sender name is required.');
  }

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.push('A valid contact email is required.');
  }

  if (!normalizedIban) {
    errors.push('An IBAN is required to locate the destination account.');
  }

  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    errors.push('Amount must be greater than 0.');
  }

  let destinationAccount = null;
  if (!errors.length && normalizedIban) {
    destinationAccount = await Account.findByIban(normalizedIban);
    if (!destinationAccount) {
      errors.push('We could not find an account with that IBAN.');
    }
  }

  if (errors.length) {
    return res
      .status(400)
      .type('html')
      .send(
        renderTemplate(
          buildViewModel({
            errors,
            form: { senderName, senderEmail, iban, amount, reference }
          })
        )
      );
  }

  const newBalance = parseFloat(destinationAccount.balance) + rawAmount;
  await Account.updateBalance(destinationAccount.id, newBalance);

  const descriptorParts = [
    `External payment from ${trimmedName}`,
    trimmedEmail ? `Contact ${trimmedEmail}` : null,
    reference?.trim() ? `Reference: ${reference.trim()}` : null
  ].filter(Boolean);

  await Transaction.create(
    null,
    destinationAccount.id,
    rawAmount,
    'deposit',
    'completed',
    descriptorParts.join(' | ') || 'External payment portal'
  );

  return res
    .status(200)
    .type('html')
    .send(
      renderTemplate(
        buildViewModel({
          success: 'Payment received! The account owner can already see the funds.',
          recentAccount: {
            iban: destinationAccount.iban,
            account_number: destinationAccount.account_number,
            amount: rawAmount.toFixed(2),
            balance: newBalance.toFixed(2)
          }
        })
      )
    );
});

export default router;
