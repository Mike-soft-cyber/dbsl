const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_BASE_URL,
  CALLBACK_URL,
} = process.env;

const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

// Get OAuth token
async function getMpesaToken() {
  const url = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

  const res = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  return res.data.access_token;
}

// Initiate STK Push
async function stkPush(phone, amount, accountRef, transactionDesc) {
  const token = await getMpesaToken();

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, -3);

  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone.startsWith('254') ? phone : phone.replace(/^0/, '254'),
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phone.startsWith('254') ? phone : phone.replace(/^0/, '254'),
    CallBackURL: CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: transactionDesc,
  };

  const res = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

module.exports = { getMpesaToken, stkPush };
