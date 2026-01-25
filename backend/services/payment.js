const axios = require('axios');
const axiosRetry = require('axios-retry').default;
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

const mpesaAxios = axios.create({ baseURL: MPESA_BASE_URL });

axiosRetry(mpesaAxios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return error.response?.status >= 500 || error.code === 'ECONNABORTED';
  },
});


let cachedToken = null;
let tokenExpiry = null;


const getAccessToken = async () => {
  if (cachedToken && tokenExpiry > Date.now()) {
    return cachedToken;
  }

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

  try {
    const response = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; 

    console.log("✅ Token fetched successfully");
    return cachedToken;
  } catch (error) {
    console.error("❌ Failed to fetch access token:", error.response?.data || error.message);
    throw new Error("MPESA token error");
  }
};


const stkPush = async (
  phoneNumber,
  amount,
  accountReference = "DocumentPayment",
  transactionDesc = "Payment for document"
) => {
  const accessToken = await getAccessToken();

  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  try {
    console.log("📤 STK Push Payload:", payload);

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Using MPESA_BASE_URL:", MPESA_BASE_URL);
    console.log("✅ STK Push initiated:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ STK Push Failed:", error.response?.data || error.message);
    throw new Error("STK push error");
  }
};


const queryStkPushStatus = async (checkoutRequestID) => {
  const accessToken = await getAccessToken();

  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestID,
  };

  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("📥 STK Query Result:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ STK Query Failed:", error.response?.data || error.message);
    throw new Error("STK query error");
  }
};

module.exports = {
  getAccessToken,
  stkPush,
  queryStkPushStatus,
};
