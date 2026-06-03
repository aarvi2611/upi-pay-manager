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

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const transaction = await prisma.transaction.create({
      data: {
        orderId,
        customerName,
        customerPhone,
        amount: parseFloat(amount),
        purpose,
        status: "PENDING",
      },
    });

    // Mirror to Firestore (best-effort)
    try {
      const db = getFirestore();
      await db.collection('transactions').doc(transaction.id).set({
        ...transaction,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        userEmail: session.user?.email || null,
      });
    } catch (err) {
      // swallow Firestore errors to avoid failing the request
      console.error('Firestore write failed', err);
    }

    return NextResponse.json(transaction);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
