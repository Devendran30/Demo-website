export const runtime = 'nodejs';

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!keyId.startsWith('rzp_test_') || !keySecret) return Response.json({ configured: false, keyId: '', mode: 'unconfigured' });
  try {
    const check = await fetch('https://api.razorpay.com/v1/payments?count=1', {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` },
      cache: 'no-store',
    });
    return Response.json({ configured: check.ok, keyId: check.ok ? keyId : '', mode: check.ok ? 'test' : 'unconfigured' });
  } catch {
    return Response.json({ configured: false, keyId: '', mode: 'unconfigured' });
  }
}
