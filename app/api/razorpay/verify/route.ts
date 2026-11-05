import { createHmac, timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId?.startsWith('rzp_test_') || !keySecret) return Response.json({ error: 'A Razorpay test Key ID and Key Secret must be configured on the server.' }, { status: 503 });

  let body: { razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid payment response.' }, { status: 400 }); }
  const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return Response.json({ error: 'Payment details are incomplete.' }, { status: 400 });
  }

  const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(signature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return Response.json({ error: 'Razorpay payment signature is invalid.' }, { status: 400 });

  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` },
      cache: 'no-store',
    });
    const payment = await response.json();
    if (!response.ok || payment.order_id !== orderId || payment.status !== 'captured') {
      return Response.json({ error: 'Payment could not be confirmed as successful.' }, { status: 400 });
    }
    return Response.json({ verified: true, paymentId, orderId, amount: payment.amount, method: payment.method });
  } catch {
    return Response.json({ error: 'Could not confirm payment with Razorpay.' }, { status: 502 });
  }
}
