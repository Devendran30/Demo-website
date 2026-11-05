export const runtime = 'nodejs';

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId?.startsWith('rzp_test_') || !keySecret) return Response.json({ error: 'A Razorpay test Key ID and Key Secret must be configured on the server.' }, { status: 503 });

  let body: { amount?: unknown; name?: unknown; email?: unknown; phone?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) return Response.json({ error: 'Invalid payment amount.' }, { status: 400 });
  const amountInPaise = Math.round(amount * 100);
  if (Math.abs(amountInPaise / 100 - amount) > 0.00001) return Response.json({ error: 'Amount must be in whole paise.' }, { status: 400 });

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt: `web_${crypto.randomUUID().replaceAll('-', '').slice(0, 32)}`, notes: {
        customer_name: typeof body.name === 'string' ? body.name.slice(0, 80) : '',
        customer_email: typeof body.email === 'string' ? body.email.slice(0, 120) : '',
        customer_phone: typeof body.phone === 'string' ? body.phone.slice(0, 20) : '',
      } }),
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) return Response.json({ error: data?.error?.description || 'Razorpay could not create the order.' }, { status: 502 });
    return Response.json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch {
    return Response.json({ error: 'Could not connect to Razorpay. Please try again.' }, { status: 502 });
  }
}
