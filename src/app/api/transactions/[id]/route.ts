import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFirestore } from '@/lib/firebaseAdmin';

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
