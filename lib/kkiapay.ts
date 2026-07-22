// lib/kkiapay.ts

// ✅ CONFIGURATION LIVE & SANDBOX DYNAMIQUE
function getKkiapayConfig() {
  const secret = process.env.KKIAPAY_SECRET?.trim() || '';
  const privateKey = process.env.KKIAPAY_PRIVATE_API_KEY?.trim() || '';
  const publicKey = process.env.KKIAPAY_PUBLIC_API_KEY?.trim() || process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_API_KEY?.trim() || '';

  if (!privateKey || !publicKey || !secret) {
    console.error('❌ Kkiapay configuration error: Missing environment variables', { secret: Boolean(secret), privateKey: Boolean(privateKey), publicKey: Boolean(publicKey) });
    throw new Error('Kkiapay environment variables are not properly configured');
  }

  const isSandbox = privateKey.startsWith('tpk') || secret.startsWith('tsk') || process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX === 'true';
  const baseUrl = isSandbox ? 'https://api-sandbox.kkiapay.me' : 'https://api.kkiapay.me';
  
  console.log(`🔧 Kkiapay Config - MODE ${isSandbox ? 'SANDBOX' : 'LIVE'}`);
  console.log(`🔧 URL: ${baseUrl}`);
  
  return {
    secret,
    privateKey,
    publicKey,
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

async function verifyKkiapayTransaction(transactionId: string, retries = 2): Promise<VerificationResult> {
  const config = getKkiapayConfig();
  const url = `${config.baseUrl}/api/v1/transactions/status`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[KKIAPAY] Verifying transaction: ${transactionId} (Attempt ${attempt}/${retries})`);
      console.log(`[KKIAPAY] Using base URL: ${config.baseUrl}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': config.privateKey,
          'x-api-key': config.privateKey,
          'x-private-key': config.privateKey,
          'x-secret-key': config.secret,
        },
        body: JSON.stringify({ transactionId }),
      });

      console.log(`[KKIAPAY] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[KKIAPAY] HTTP Error ${response.status}: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error(`Authentication failed - Vérifie tes clés API LIVE (x-api-key / private key)`);
        }
        if (response.status === 404) {
          if (attempt < retries) {
            console.warn(`[KKIAPAY] Transaction ${transactionId} non trouvée (404), nouvelle tentative dans 1s...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw new Error(`Transaction ${transactionId} non trouvée sur Kkiapay (${config.isSandbox ? 'SANDBOX' : 'LIVE'})`);
        }
        throw new Error(`Kkiapay API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[KKIAPAY] Verification success:`, data);

      return {
        status: data.status,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod || 'KKIAPAY',
        transactionId: data.transactionId || transactionId,
        currency: data.currency || 'XOF',
        state: data.state || '',
        reason: data.reason,
        message: data.message,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[KKIAPAY] Tentative ${attempt} échouée:`, lastError.message);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error(`Vérification de la transaction Kkiapay échouée pour ${transactionId}`);
}

export { verifyKkiapayTransaction, getKkiapayConfig };
export type { VerificationResult };