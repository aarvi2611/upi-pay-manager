import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFirestore } from '@/lib/firebaseAdmin';
import { toDate } from "@/lib/date";

export const dynamic = "force-dynamic";

function serializeTransaction(transaction: any) {
  return {
    ...transaction,
    amount: parseFloat(transaction.amount) || 0,
    paymentDate: transaction.paymentDate ? toDate(transaction.paymentDate).toISOString() : null,
    createdAt: transaction.createdAt ? toDate(transaction.createdAt).toISOString() : null,
    updatedAt: transaction.updatedAt ? toDate(transaction.updatedAt).toISOString() : null,
  };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirestore();
    const doc = await db.collection('transactions').doc(params.id).get();

    if (doc.exists) {
      return NextResponse.json(serializeTransaction({
        id: doc.id,
        ...doc.data(),
      }));
    }
  } catch (err) {
    console.error('Firestore transaction read failed', err);
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (transaction) return NextResponse.json(serializeTransaction(transaction));
  } catch (error) {
    console.error("Prisma transaction read failed", error);
  }

  return new NextResponse("Not Found", { status: 404 });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const { status, utrNumber } = body;
    const updatedAt = new Date();
    const updateData = {
      status,
      ...(utrNumber && { utrNumber }),
      ...(status === "PAID" && { paymentDate: updatedAt.toISOString() }),
      updatedAt: updatedAt.toISOString(),
    };

    try {
      const db = getFirestore();
      const docRef = db.collection('transactions').doc(params.id);
      const doc = await docRef.get();

      if (doc.exists) {
        await docRef.set(updateData, { merge: true });
        return NextResponse.json({
          id: doc.id,
          ...doc.data(),
          ...updateData,
        });
      }
    } catch (err) {
      console.error('Firestore update failed', err);
    }

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        status,
        ...(utrNumber && { utrNumber }),
        ...(status === "PAID" && { paymentDate: new Date() }),
      },
    });

    // Update Firestore mirror (best-effort)
    try {
      const db = getFirestore();
      await db.collection('transactions').doc(transaction.id).set({
        ...transaction,
        paymentDate: transaction.paymentDate ? transaction.paymentDate.toISOString() : null,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error('Firestore update failed', err);
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('utrNumber')) {
      return new NextResponse("UTR Number already exists", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
