import TransactionList from "./TransactionList";
import { getFirestore } from '@/lib/firebaseAdmin';
import { getPublicBaseUrl } from "@/lib/publicUrl";
import { headers } from "next/headers";
import { toDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const publicBaseUrl = getPublicBaseUrl(headers());

  // Read from Firestore mirror if available, otherwise fallback to empty list
  let transactions = [];
  try {
    const db = getFirestore();
    const snap = await db.collection('transactions').orderBy('createdAt', 'desc').get();
    transactions = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderId: data.orderId || '',
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || null,
        amount: parseFloat(data.amount) || 0,
        purpose: data.purpose || null,
        status: data.status || 'PENDING',
        utrNumber: data.utrNumber || null,
        paymentDate: data.paymentDate ? toDate(data.paymentDate) : null,
        createdAt: data.createdAt ? toDate(data.createdAt) : null,
        updatedAt: data.updatedAt ? toDate(data.updatedAt) : null,
      };
    });
  } catch (err) {
    console.error('Failed to read Firestore transactions', err);
    transactions = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
      </div>
      <TransactionList initialData={transactions} publicBaseUrl={publicBaseUrl} />
    </div>
  );
}
