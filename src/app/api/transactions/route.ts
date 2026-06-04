import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFirestore } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const { customerName, customerPhone, amount, purpose } = body;
    const upiTarget = body.upiTarget === "PERSONAL" ? "PERSONAL" : "MERCHANT";

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId,
      customerName,
      customerPhone: customerPhone || null,
      amount: parseFloat(amount),
      purpose: purpose || null,
      upiTarget,
      status: "PENDING",
      utrNumber: null,
      paymentDate: null,
      proofUrl: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    let savedTransaction: any = transaction;
    let saved = false;

    try {
      const db = getFirestore();
      await db.collection('transactions').doc(transaction.id).set({
        ...transaction,
        userEmail: session.user?.email || null,
      });
      saved = true;
    } catch (err) {
      console.error('Firestore write failed', err);
    }

    try {
      savedTransaction = await prisma.transaction.create({
        data: {
          id: transaction.id,
          orderId,
          customerName,
          customerPhone: customerPhone || null,
          amount: parseFloat(amount),
          purpose: purpose || null,
          upiTarget,
          status: "PENDING",
        },
      });
      saved = true;
    } catch (error) {
      console.error("Prisma transaction create failed", error);
    }

    if (!saved) {
      return new NextResponse("Failed to create transaction", { status: 500 });
    }

    return NextResponse.json(savedTransaction);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
