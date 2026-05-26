export type QPayBankUrl = {
  name: string;
  description: string;
  logo: string;
  link: string;
};

export type QPayInvoiceResponse = {
  invoice_id: string;
  qr_text?: string;
  qr_image?: string;
  qPay_shortUrl?: string;
  urls?: QPayBankUrl[];
};

export type QPayPaymentCheckResponse = {
  count?: number;
  paid_amount?: number;
  rows?: Array<{
    payment_id?: string;
    payment_status?: string;
    payment_date?: string;
    payment_amount?: string | number;
    payment_currency?: string;
  }>;
};

const DEFAULT_ENDPOINT = 'https://merchant.qpay.mn';

function getEndpoint() {
  return (process.env.QPAY_ENDPOINT || DEFAULT_ENDPOINT).replace(/\/$/, '');
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function qpayFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getEndpoint()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `QPay request failed: ${response.status}`);
  }

  return data as T;
}

export async function getQPayToken() {
  const username = requireEnv('QPAY_USERNAME');
  const password = requireEnv('QPAY_PASSWORD');
  const basicToken = Buffer.from(`${username}:${password}`).toString('base64');

  const data = await qpayFetch<{ access_token: string }>('/v2/auth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
    },
  });

  return data.access_token;
}

export async function createQPayInvoice(input: {
  orderId: string;
  customerCode: string;
  description: string;
  amount: number;
}) {
  const accessToken = await getQPayToken();
  const invoiceCode = requireEnv('QPAY_INVOICE_CODE');
  const baseUrl = requireEnv('NEXT_PUBLIC_SITE_URL').replace(/\/$/, '');

  return qpayFetch<QPayInvoiceResponse>('/v2/invoice', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      invoice_code: invoiceCode,
      sender_invoice_no: input.orderId,
      invoice_receiver_code: input.customerCode,
      invoice_description: input.description.slice(0, 255),
      amount: Math.round(input.amount),
      callback_url: `${baseUrl}/api/qpay/callback?orderId=${encodeURIComponent(input.orderId)}`,
    }),
  });
}

export async function checkQPayInvoice(invoiceId: string) {
  const accessToken = await getQPayToken();

  return qpayFetch<QPayPaymentCheckResponse>('/v2/payment/check', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    }),
  });
}
