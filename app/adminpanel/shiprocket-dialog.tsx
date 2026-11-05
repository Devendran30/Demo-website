'use client';

import { useEffect, useState } from 'react';
import { fakeAwb, type Order, type OrderStatus, type Shipment } from './demo-data';

// KaavuStyles' Shiprocket shipment dialog, simulated for the demo: creating a shipment returns Shiprocket
// order and shipment ids, and each "Refresh Shiprocket status" moves the parcel one step further along.

const PICKUP_LOCATIONS = [
  { name: 'Bengaluru Warehouse', address: '14, 2nd Cross, Peenya Industrial Area, Bengaluru, Karnataka 560058' },
  { name: 'Mumbai Hub', address: 'Unit 7, Marol Co-op Estate, Andheri East, Mumbai, Maharashtra 400059' },
  { name: 'Chennai Store', address: '22, Usman Road, T. Nagar, Chennai, Tamil Nadu 600017' },
];

const COURIERS = ['Delhivery', 'Blue Dart', 'Xpressbees', 'Ekart', 'DTDC'];

/** Shiprocket's status after each refresh, and what it means for the shipment and the order. */
const NEXT_STEP: Record<string, { remote: string; status: Shipment['status']; order: OrderStatus }> = {
  NEW: { remote: 'PICKUP SCHEDULED', status: 'Created', order: 'Processing' },
  'PICKUP SCHEDULED': { remote: 'IN TRANSIT', status: 'In Transit', order: 'Shipped' },
  'IN TRANSIT': { remote: 'OUT FOR DELIVERY', status: 'In Transit', order: 'Shipped' },
  'OUT FOR DELIVERY': { remote: 'DELIVERED', status: 'Delivered', order: 'Delivered' },
};

/** Shipments saved before Shiprocket ids existed only have our own status. */
const remoteStatusOf = (shipment: Shipment) =>
  shipment.remoteStatus ?? { Created: 'NEW', 'In Transit': 'IN TRANSIT', Delivered: 'DELIVERED', Cancelled: 'CANCELED' }[shipment.status];

const randomId = () => 100000000 + Math.floor(Math.random() * 900000000);

export function ShiprocketDialog({
  order, onClose, onSave,
}: {
  order: Order; onClose: () => void; onSave: (changes: Partial<Order>, message: string) => void;
}) {
  const shipping = order.shipment;
  const needsReplacement = shipping?.status === 'Cancelled';
  const showSummary = !!shipping && !needsReplacement;
  const canShip = order.paymentStatus === 'Paid' || order.paymentMethod === 'Cash on Delivery';

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickupLocation, setPickupLocation] = useState(shipping?.pickup ?? '');
  const [deliveryState, setDeliveryState] = useState(shipping?.deliveryState ?? order.state);
  const [dims] = useState(() => shipping?.dimensions.match(/[\d.]+/g) ?? []);
  const [measurements, setMeasurements] = useState({
    weight: shipping ? String(shipping.weightKg) : '', length: dims[0] ?? '', width: dims[1] ?? '', height: dims[2] ?? '',
  });

  // Pretend to fetch the pickup addresses registered in Shiprocket; Escape closes unless a request is running.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const keepCancelled = (status: OrderStatus) => (order.orderStatus === 'Cancelled' ? 'Cancelled' : status);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const [weight, length, width, height] = [measurements.weight, measurements.length, measurements.width, measurements.height].map(Number);
    if (![weight, length, width, height].every((n) => n > 0)) return setError('Enter the packed weight and all three measurements.');
    setBusy(true);
    setError('');
    setTimeout(() => {
      const shipment: Shipment = {
        courier: '',
        awb: '',
        pickup: pickupLocation,
        weightKg: weight,
        dimensions: `${length} × ${width} × ${height} cm`,
        status: 'Created',
        createdAt: new Date().toISOString(),
        srOrderId: randomId(),
        srShipmentId: randomId(),
        remoteStatus: 'NEW',
        deliveryState: deliveryState.trim(),
      };
      onSave(
        { shipment, orderStatus: order.orderStatus === 'Pending' ? keepCancelled('Processing') : order.orderStatus },
        `${needsReplacement ? 'Replacement shipment' : 'Shiprocket order'} ${shipment.srOrderId} created for ${order.orderNumber}`,
      );
      setBusy(false);
    }, 900);
  };

  const refresh = () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setTimeout(() => {
      setBusy(false);
      if (!shipping) return setError(`Shiprocket has no order for ${order.orderNumber} yet. Enter the parcel details below to create one.`);
      const step = NEXT_STEP[remoteStatusOf(shipping)];
      if (!step) return onSave({}, `${order.orderNumber}: no new updates from Shiprocket (${remoteStatusOf(shipping)})`);
      const assigned = shipping.awb ? {} : { courier: COURIERS[Math.floor(Math.random() * COURIERS.length)], awb: fakeAwb() };
      onSave(
        {
          shipment: { ...shipping, ...assigned, status: step.status, remoteStatus: step.remote },
          orderStatus: keepCancelled(step.order),
          // Cash on delivery is collected when the parcel arrives.
          paymentStatus: step.order === 'Delivered' && order.paymentMethod === 'Cash on Delivery' ? 'Paid' : order.paymentStatus,
        },
        `${order.orderNumber}: Shiprocket status is now ${step.remote}`,
      );
    }, 800);
  };

  // Lets the demo show Kaavu's replacement flow without a real cancellation in Shiprocket.
  const simulateCancel = () => {
    if (!shipping) return;
    onSave(
      {
        shipment: { ...shipping, status: 'Cancelled', remoteStatus: 'CANCELED' },
        orderStatus: ['Cancelled', 'Delivered'].includes(order.orderStatus) ? order.orderStatus : 'Processing',
      },
      `${order.orderNumber}: shipment cancelled in Shiprocket`,
    );
  };

  const inputClass = 'w-full rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] px-3 py-3 text-base sm:text-[14px] font-semibold text-[#1d1d1f] outline-none focus:bg-white focus:border-[#ea580c] focus:ring-4 focus:ring-[#ea580c]/10 transition-all disabled:opacity-60';
  const pickup = PICKUP_LOCATIONS.find((location) => location.name === pickupLocation);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="shipping-title" className="w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 bg-[#1d1d1f] text-white p-5 sticky top-0 z-10">
          <div>
            <h2 id="shipping-title" className="text-xl font-bold tracking-tight flex items-center gap-2">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              Shiprocket shipment
            </h2>
            <p className="text-xs font-semibold text-[#f97316] mt-1">{order.orderNumber} · {order.customerName}</p>
          </div>
          <button type="button" aria-label="Close shipment form" disabled={busy} onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-bold disabled:opacity-50">✕</button>
        </div>

        <div className="px-5 pt-4 space-y-3">
          <button type="button" disabled={busy} onClick={refresh} className="w-full rounded-xl border border-[#ea580c] text-[#ea580c] hover:bg-[#fff2e8] px-4 py-3 text-[13px] font-bold transition-colors disabled:opacity-50">
            {busy ? 'Checking Shiprocket…' : 'Refresh Shiprocket status'}
          </button>
          {error && <p role="alert" className="text-[13px] font-semibold text-red-600">{error}</p>}
        </div>

        {showSummary && shipping ? (
          <div className="p-5 space-y-4 text-[14px] text-[#1d1d1f]">
            <p className="font-bold">{shipping.srOrderId ? 'Order linked to Shiprocket' : 'Shipment booked'}</p>
            <p>Shiprocket status: <strong className="text-[#ea580c]">{remoteStatusOf(shipping)}</strong></p>
            {shipping.srOrderId && (
              <p>Shiprocket order: <strong>{shipping.srOrderId}</strong><br />Shipment: <strong>{shipping.srShipmentId}</strong></p>
            )}
            <p>
              {shipping.awb
                ? <>Courier: <strong>{shipping.courier}</strong> · AWB <strong className="font-mono">{shipping.awb}</strong></>
                : <span className="text-[#86868b]">Courier and AWB not assigned yet.</span>}
            </p>
            <p className="text-[#86868b]">{shipping.weightKg} kg · {shipping.dimensions}<br />Pickup: {shipping.pickup}</p>
            <p className="text-[#86868b]">
              {shipping.status === 'Delivered'
                ? 'Shiprocket confirmed delivery. The order has been marked Delivered.'
                : 'Choose a courier, generate your shipping label and schedule pickup in Shiprocket. Creating this order does not mark it as shipped — use Refresh to pull the latest status.'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a href="https://app.shiprocket.in/seller/orders" target="_blank" rel="noreferrer" className="inline-block rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white px-5 py-3 text-[13px] font-bold shadow-sm">Open Shiprocket</a>
              {shipping.status !== 'Delivered' && (
                <button type="button" disabled={busy} onClick={simulateCancel} className="text-[12px] font-semibold text-[#86868b] hover:text-red-600 underline underline-offset-2">
                  Demo: cancel this shipment in Shiprocket
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-5">
            {needsReplacement && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
                <strong>Cancelled shipment</strong>
                <p className="mt-1">The shipment was cancelled in Shiprocket. Your website order is still active. Create a replacement shipment only if the customer still needs delivery.</p>
                <p className="mt-2">Confirm the parcel details below to create a replacement. The website order number and payment stay unchanged.</p>
              </div>
            )}
            <div className="bg-[#f9f9fb] rounded-xl border border-[#e5e5ea] p-4 text-[13px]">
              <p className="font-bold text-[#1d1d1f]">Delivery address</p>
              <p className="text-[#86868b] font-semibold mt-1">{order.shippingAddress}, {order.city} · {order.postalCode}</p>
            </div>
            <label className="block text-[13px] font-bold text-[#1d1d1f]">
              Delivery state
              <input required value={deliveryState} onChange={(event) => setDeliveryState(event.target.value)} className={`${inputClass} mt-2`} placeholder="Customer's state, e.g. Karnataka" />
            </label>
            <label className="block text-[13px] font-bold text-[#1d1d1f]">
              Pickup location
              <select required disabled={loading || busy} value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} className={`${inputClass} mt-2 cursor-pointer`}>
                <option value="">{loading ? 'Loading registered pickups…' : 'Select your pickup location'}</option>
                {PICKUP_LOCATIONS.map((location) => <option key={location.name} value={location.name}>{location.name}</option>)}
              </select>
            </label>
            {pickup && <p className="-mt-3 text-[12px] font-semibold text-[#86868b]">{pickup.address}</p>}
            <fieldset>
              <legend className="text-[17px] font-bold tracking-tight text-[#1d1d1f] mb-3">Packed parcel measurements</legend>
              <div className="grid grid-cols-2 gap-4">
                {([['weight', 'Weight (kg)'], ['length', 'Length (cm)'], ['width', 'Width (cm)'], ['height', 'Height (cm)']] as const).map(([key, label]) => (
                  <label key={key} className="text-[13px] font-bold text-[#1d1d1f]">
                    {label}
                    <input
                      type="number"
                      inputMode="decimal"
                      required
                      min="0.01"
                      max="1000"
                      step="0.01"
                      value={measurements[key]}
                      onChange={(event) => { setMeasurements({ ...measurements, [key]: event.target.value }); setError(''); }}
                      className={`${inputClass} mt-2`}
                      placeholder="Enter value"
                    />
                  </label>
                ))}
              </div>
              <p className="text-[12px] font-semibold text-[#86868b] mt-3">Measure the sealed parcel, including its packaging.</p>
            </fieldset>
            <button disabled={loading || busy || !canShip || order.orderStatus === 'Cancelled'} className="w-full rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white p-3.5 text-[14px] font-bold shadow-md disabled:opacity-50">
              {busy ? 'Creating shipment…' : needsReplacement ? 'Create replacement shipment' : 'Create Shiprocket order'}
            </button>
            {!canShip && <p className="text-[12px] font-semibold text-red-600">Payment must be confirmed before creating a shipment. Use “Check pending payments” first.</p>}
            {order.orderStatus === 'Cancelled' && <p className="text-[12px] font-semibold text-red-600">This order is cancelled, so it can’t be shipped.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
