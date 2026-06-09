import TransactionList from "./TransactionList";
import type { TransactionListItem } from "./TransactionList";
import { getFirestore } from '@/lib/firebaseAdmin';
import { getPublicBaseUrl } from "@/lib/publicUrl";
import { headers } from "next/headers";
import { toDate } from "@/lib/date";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const publicBaseUrl = getPublicBaseUrl(headers());

  const transactionMap = new Map<string, TransactionListItem>();
  let businessProfile = {
    name: "Axienta Business Consulting",
    phone: "",
  };

  try {
    const db = getFirestore();
    const doc = await db.collection("settings").doc("business-profile").get();
    const data = doc.exists ? doc.data() : null;
    if (data) {
      businessProfile = {
        name: data.name || businessProfile.name,
        phone: data.phone || "",
      };
    }
  } catch (err) {
    console.error("Failed to read Firestore business profile", err);
  }

  try {
    const profile = await prisma.businessProfile.findFirst();
    if (profile) {
      businessProfile = {
        name: profile.name || businessProfile.name,
        phone: profile.phone || businessProfile.phone,
      };
    }
  } catch (err) {
    console.error("Failed to read Prisma business profile", err);
  }

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
      const transactionWithUpiTarget = tx as typeof tx & { upiTarget?: string };

      transactionMap.set(tx.id, {
        id: tx.id,
        orderId: tx.orderId,
        customerName: tx.customerName,
        customerPhone: tx.customerPhone,
        amount: tx.amount,
        purpose: tx.purpose,
        upiTarget: transactionWithUpiTarget.upiTarget || "MERCHANT",
        status: tx.status,
        utrNumber: tx.utrNumber,
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
      <TransactionList initialData={transactions} publicBaseUrl={publicBaseUrl} businessProfile={businessProfile} />
    </div>
  );
}
