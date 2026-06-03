import prisma from "@/lib/prisma";
import { getFirestore } from "@/lib/firebaseAdmin";
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

  if (!businessProfile) {
    businessProfile = await prisma.businessProfile.findFirst().catch((error) => {
      console.error("Failed to load Prisma business profile", error);
      return null;
    });
  }

  businessProfile = businessProfile || {
    name: "My Store",
    upiId: "merchant@upi",
  };

  // Construct UPI URL string
  // upi://pay?pa=upiId&pn=BusinessName&tr=orderId&tn=purpose&am=amount&cu=INR
  const upiUrl = `upi://pay?pa=${encodeURIComponent(businessProfile.upiId)}&pn=${encodeURIComponent(businessProfile.name)}&tr=${encodeURIComponent(transaction.orderId)}&tn=${encodeURIComponent(transaction.purpose || "Payment")}&am=${transaction.amount}&cu=INR`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <PaymentView 
        transaction={transaction} 
        businessProfile={businessProfile} 
        upiUrl={upiUrl}
      />
    </div>
  );
}
