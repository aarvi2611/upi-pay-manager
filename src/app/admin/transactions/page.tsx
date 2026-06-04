import TransactionList from "./TransactionList";
import { getFirestore } from '@/lib/firebaseAdmin';
import { getPublicBaseUrl } from "@/lib/publicUrl";
import { headers } from "next/headers";
import { toDate } from "@/lib/date";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const publicBaseUrl = getPublicBaseUrl(headers());

  const transactionMap = new Map<string, any>();

  try {
    const db = getFirestore();
    const snap = await db.collection('transactions').orderBy('createdAt', 'desc').get();
    snap.docs.forEach((d) => {
      const data = d.data();
      transactionMap.set(d.id, {
        id: d.id,
        orderId: data.orderId || '',
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || null,
        amount: parseFloat(data.amount) || 0,
        purpose: data.purpose || null,
        upiTarget: data.upiTarget || 'MERCHANT',
        status: data.status || 'PENDING',
        utrNumber: data.utrNumber || null,
        paymentDate: data.paymentDate ? toDate(data.paymentDate).toISOString() : null,
        createdAt: data.createdAt ? toDate(data.createdAt).toISOString() : null,
        updatedAt: data.updatedAt ? toDate(data.updatedAt).toISOString() : null,
      });
    });
  } catch (err) {
    console.error('Failed to read Firestore transactions', err);
  }

  try {
    const prismaTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });

    prismaTransactions.forEach((tx) => {
      if (transactionMap.has(tx.id)) return;

      transactionMap.set(tx.id, {
        ...tx,
        paymentDate: tx.paymentDate ? toDate(tx.paymentDate).toISOString() : null,
        createdAt: tx.createdAt ? toDate(tx.createdAt).toISOString() : null,
        updatedAt: tx.updatedAt ? toDate(tx.updatedAt).toISOString() : null,
      });
    });
  } catch (err) {
    console.error('Failed to read Prisma transactions', err);
  }

  const transactions = Array.from(transactionMap.values()).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
      </div>
      <TransactionList initialData={transactions} publicBaseUrl={publicBaseUrl} />
    </div>
  );
}
