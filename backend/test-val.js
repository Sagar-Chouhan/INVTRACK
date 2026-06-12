import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import { body, validationResult } from 'express-validator';
dotenv.config();

const app = express();
app.use(express.json());

app.post('/api/issues', [
    body('productId').optional().notEmpty(),
    body('stock_id').optional().notEmpty(),
    body('recipientName').optional().notEmpty(),
    body('recipient_name').optional().notEmpty(),
    body('issuedBy').optional().notEmpty(),
    body('mobileNumber').optional().notEmpty(),
    body('quantity').optional().isNumeric(),
    body('issued_qty').optional().isNumeric(),
    body('purpose').optional().isString(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.json({ success: true });
});

// Test the validation rules
const testReq = {
  stock_id: '123',
  issued_qty: 5,
  purpose: '',
  incharge_id: '',
  recipient_name: 'Test',
  recipient_mobile: '1234567890',
  recipient_email: ''
};

fetch('http://localhost:3000/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testReq)
}).then(r => r.json()).then(console.log).catch(console.error);

app.listen(3000, () => {
  console.log('Server started');
});
