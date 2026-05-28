'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserFullDetail, toggleUserBlock } from '@/_services/admin/user';
import { toast } from 'react-toastify';
import { RiLoader2Line } from 'react-icons/ri';
import Image from 'next/image';
import Link from 'next/link';

type TabKey = 'profile' | 'addresses' | 'orders' | 'payments' | 'reviews' | 'wishlist';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'orders', label: 'Orders' },
  { key: 'payments', label: 'Payments' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'wishlist', label: 'Wishlist' },
];

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('profile');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: any = await getUserFullDetail(id);
        setData(res);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RiLoader2Line className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data?.user) {
    return <div className="text-center py-20 text-gray-500">User not found</div>;
  }

  const { user, addresses, orders, payments, reviews, wishlist } = data;

  return (
    <div className="max-w-8xl mx-auto px-4 lg:px-10 py-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{user.username || 'Unnamed User'}</h2>
        <p className="text-gray-600">{user.email} · {user.number || 'No number'}</p>
        <div className="mt-2 flex gap-2 text-xs">
          <span className={`px-2 py-2 rounded ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {user.isVerified ? 'Verified' : 'Not Verified'}
          </span>
          <span className={`px-2 py-2 rounded ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {user.isBlocked ? 'Blocked' : 'Active'}
          </span>
          <button
            onClick={async () => {
              try {
                await toggleUserBlock(id, !user.isBlocked);
                setData((prev: any) => ({ ...prev, user: { ...prev.user, isBlocked: !user.isBlocked } }));
                toast.success(user.isBlocked ? 'Unblocked' : 'Blocked');
              } catch {
                toast.error('Failed');
              }
            }}
            className={`px-4 py-2 rounded-lg text-white text-sm ${user.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {user.isBlocked ? 'Unblock User' : 'Block User'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap border-b">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              {t.label}
              {t.key === 'orders' && ` (${orders?.length || 0})`}
              {t.key === 'addresses' && ` (${addresses?.length || 0})`}
              {t.key === 'reviews' && ` (${reviews?.length || 0})`}
              {t.key === 'wishlist' && ` (${wishlist?.length || 0})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* PROFILE */}
          {tab === 'profile' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Username" value={user.username} />
              <Field label="Email" value={user.email} />
              <Field label="Number" value={user.number} />
              <Field label="Role" value={user.role} />
              <Field label="Verified" value={user.isVerified ? 'Yes' : 'No'} />
              <Field label="Created" value={new Date(user.createdAt).toLocaleString()} />
            </div>
          )}

          {/* ADDRESSES */}
          {tab === 'addresses' && (
            <div className="space-y-3">
              {addresses?.length ? addresses.map((a: any) => (
                <div key={a._id} className="border rounded-lg p-4 text-sm">
                  <p className="font-semibold">{a.fullName} · {a.mobileNumber}</p>
                  <p className="text-gray-600">{a.addressLine}, {a.city}, {a.state} - {a.postCode}</p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{a.addressType}</span>
                  {a.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">Default</span>}
                </div>
              )) : <Empty text="No addresses" />}
            </div>
          )}

          {/* ORDERS */}
          {tab === 'orders' && (
            <div className="overflow-x-auto">
              {orders?.length ? (
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => (
                      <tr key={o._id} className="border-b">
                        <td className="py-2 px-3">{o.orderId}</td>
                        <td className="py-2 px-3">₹{o.payAmt}</td>
                        <td className="py-2 px-3 capitalize">{o.status}</td>
                        <td className="py-2 px-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <Empty text="No orders" />}
            </div>
          )}

          {/* PAYMENTS */}
          {tab === 'payments' && (
            <div className="overflow-x-auto">
              {payments?.length ? (
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Paid</th>
                      <th className="py-2 px-3">Txn ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 px-3">{p.orderId}</td>
                        <td className="py-2 px-3">₹{p.payAmt}</td>
                        <td className="py-2 px-3">{p.payment?.method || '-'}</td>
                        <td className="py-2 px-3">{p.payment?.isPaid ? 'Yes' : 'No'}</td>
                        <td className="py-2 px-3 text-xs">{p.payment?.transactionId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <Empty text="No payments" />}
            </div>
          )}

          {/* REVIEWS */}
          {tab === 'reviews' && (
            <div className="space-y-3">
              {reviews?.length ? reviews.map((r: any) => (
                <div key={r._id} className="border rounded-lg p-4 text-sm">
                  <p className="font-semibold">{r.productId?.title || 'Product'}</p>
                  <p className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                  <p className="text-gray-600">{r.review}</p>
                </div>
              )) : <Empty text="No reviews" />}
            </div>
          )}

          {/* WISHLIST */}
          {tab === 'wishlist' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {wishlist?.length ? wishlist.map((w: any, i: number) => (
                <div key={i} className="border rounded-lg p-3 text-sm" title={w.productId?.title || 'Product'}>
                  <Link target='_blank' href={`/product-details/${w.productId?.slug}`} className="block mb-2">
                    {w.productId?.thumbnail?.url && (
                      <Image src={w.productId.thumbnail.url} alt="" width={700} height={700} className="w-full h-100 object-cover rounded mb-2" />
                    )}
                    <p className="line-clamp-2">{w.productId?.title || 'Product'}</p>
                  </Link>
                </div>
              )) : <Empty text="No wishlist items" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-gray-400 text-xs uppercase">{label}</p>
    <p className="text-gray-800">{value ?? 'N/A'}</p>
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <div className="text-center py-10 text-gray-400">{text}</div>
);