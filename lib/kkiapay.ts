// lib/kkiapay.ts

const KKIAPAY_SECRET = process.env.KKIAPAY_SECRET!;
const KKIAPAY_PRIVATE_API_KEY = process.env.KKIAPAY_PRIVATE_API_KEY!;
const KKIAPAY_PUBLIC_API_KEY = process.env.KKIAPAY_PUBLIC_API_KEY!;

// ✅ CONFIGURATION LIVE UNIQUEMENT
function getKkiapayConfig() {
  if (!KKIAPAY_PRIVATE_API_KEY || !KKIAPAY_PUBLIC_API_KEY || !KKIAPAY_SECRET) {
    console.error('❌ Kkiapay configuration error: Missing LIVE environment variables');
    throw new Error('Kkiapay LIVE environment variables are not properly configured');
  }

  // 🔥 TOUJOURS EN MODE LIVE
  const isSandbox = false;
  const baseUrl = 'https://api.kkiapay.me';
  
  console.log(`🔧 Kkiapay Config - MODE LIVE`);
  console.log(`🔧 URL: ${baseUrl}`);
  
  return {
    secret: KKIAPAY_SECRET,
    privateKey: KKIAPAY_PRIVATE_API_KEY,
    publicKey: KKIAPAY_PUBLIC_API_KEY,
    baseUrl,
    isSandbox
  };
}

interface VerificationResult {
  status: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  currency: string;
  state: string;
  reason?: { code?: string; message?: string };
  message?: string;
}

async function verifyKkiapayTransaction(transactionId: string): Promise<VerificationResult> {
  const config = getKkiapayConfig();
  
  try {
    const url = `${config.baseUrl}/api/v1/transactions/status`;

    console.log(`[KKIAPAY LIVE] Verifying transaction: ${transactionId}`);
    console.log(`[KKIAPAY] Using base URL: ${config.baseUrl}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.privateKey,
      },
      body: JSON.stringify({ transactionId }),
    });

    console.log(`[KKIAPAY] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[KKIAPAY] HTTP Error ${response.status}: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error(`Authentication failed - Vérifie tes clés API LIVE`);
      }
      if (response.status === 404) {
        throw new Error(`Transaction ${transactionId} not found in LIVE mode`);
      }
      throw new Error(`Kkiapay API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[KKIAPAY] Verification success:`, data);

    return {
      status: data.status,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      currency: data.currency,
      state: data.state,
      reason: data.reason,
      message: data.message,
    };
  } catch (error) {
    console.error('[KKIAPAY LIVE] API verification error:', error);
    throw error;
  }
}

export { verifyKkiapayTransaction, getKkiapayConfig };
export type { VerificationResult };