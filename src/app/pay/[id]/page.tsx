import prisma from "@/lib/prisma";
import { getFirestore } from "@/lib/firebaseAdmin";
import { toDate } from "@/lib/date";
import { notFound } from "next/navigation";
import PaymentView from "./PaymentView";

export default async function PaymentPage({ params }: { params: { id: string } }) {
  let transaction: any = null;
  let businessProfile: any = null;

  try {
    const db = getFirestore();
    const transactionDoc = await db.collection("transactions").doc(params.id).get();
    if (transactionDoc.exists) {
      transaction = { id: transactionDoc.id, ...transactionDoc.data() };
    }

    const profileDoc = await db.collection("settings").doc("business-profile").get();
    if (profileDoc.exists) {
      businessProfile = profileDoc.data();
    }
  } catch (error) {
    console.error("Failed to load Firestore payment data", error);
  }

  if (!transaction) {
    transaction = await prisma.transaction.findUnique({
      where: { id: params.id }
    }).catch((error) => {
      console.error("Failed to load Prisma transaction", error);
      return null;
    });
  }

  if (!transaction) notFound();

  transaction = {
    ...transaction,
    amount: parseFloat(transaction.amount) || 0,
    paymentDate: transaction.paymentDate ? toDate(transaction.paymentDate).toISOString() : null,
    createdAt: transaction.createdAt ? toDate(transaction.createdAt).toISOString() : null,
    updatedAt: transaction.updatedAt ? toDate(transaction.updatedAt).toISOString() : null,
  };

  if (!businessProfile) {
    businessProfile = await prisma.businessProfile.findFirst().catch((error) => {
      console.error("Failed to load Prisma business profile", error);
      return null;
    });
  }

  businessProfile = businessProfile || {
    name: "My Store",
    upiId: "merchant@upi",
    personalUpiId: null,
  };

  // Construct UPI URL string
  // Keep the URL simple. Some UPI apps flag direct browser links with custom transaction refs.
  // upi://pay?pa=upiId&pn=BusinessName&tn=purpose&am=amount&cu=INR
  const buildUpiUrl = (upiId: string) =>
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessProfile.name)}&tn=${encodeURIComponent(transaction.purpose || `Payment ${transaction.orderId}`)}&am=${transaction.amount}&cu=INR`;

  const upiUrl = buildUpiUrl(businessProfile.upiId);
  const personalUpiUrl = businessProfile.personalUpiId ? buildUpiUrl(businessProfile.personalUpiId) : null;
  const usePersonalUpi = transaction.upiTarget === "PERSONAL" && businessProfile.personalUpiId && personalUpiUrl;
  const selectedUpiId = usePersonalUpi ? businessProfile.personalUpiId : businessProfile.upiId;
  const selectedUpiUrl = usePersonalUpi ? personalUpiUrl : upiUrl;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff,transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <PaymentView
          transaction={transaction}
          businessProfile={businessProfile}
          upiUrl={selectedUpiUrl}
          selectedUpiId={selectedUpiId}
        />
      </div>
    </div>
  );
}
