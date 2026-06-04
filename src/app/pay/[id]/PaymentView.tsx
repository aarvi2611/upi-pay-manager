"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  Headphones,
  IndianRupee,
  Lock,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentView({ transaction, businessProfile, upiUrl, selectedUpiId }: any) {
  const [copied, setCopied] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(transaction);
  const activeUpiId = selectedUpiId || businessProfile.upiId;
  const activeUpiUrl = upiUrl;

  useEffect(() => {
    if (currentTransaction.status !== "PENDING") return;

    const refreshTransaction = async () => {
      try {
        const res = await fetch(`/api/transactions/${transaction.id}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const updated = await res.json();
        setCurrentTransaction(updated);
      } catch (error) {
        console.error("Failed to refresh transaction status", error);
      }
    };

    const intervalId = window.setInterval(refreshTransaction, 3000);
    refreshTransaction();

    return () => window.clearInterval(intervalId);
  }, [currentTransaction.status, transaction.id]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upiApps = [
    { label: "UPI App", short: "UPI", className: "bg-emerald-600 text-white" },
    { label: "Google Pay", short: "GPay", className: "border border-blue-100 bg-white text-blue-700" },
    { label: "PhonePe", short: "Pe", className: "bg-violet-700 text-white" },
    { label: "Paytm", short: "paytm", className: "border border-sky-100 bg-white text-sky-700" },
  ];
  const isHighValuePayment = currentTransaction.amount >= 2000;
  const createdOn = currentTransaction.createdAt
    ? new Date(currentTransaction.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Today";

  if (currentTransaction.status === "PAID") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-950">Payment Successful!</h2>
        <p className="mb-6 text-slate-500">
          Thank you, {currentTransaction.customerName}. Your payment has been received.
        </p>

        <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4 text-left">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-slate-500">Amount Paid</span>
            <span className="font-bold text-slate-950">₹{currentTransaction.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-slate-500">Order ID</span>
            <span className="text-right font-medium text-slate-950">{currentTransaction.orderId}</span>
          </div>
          {currentTransaction.utrNumber && (
            <div className="flex justify-between gap-4">
              <span className="text-sm text-slate-500">UTR/Ref No.</span>
              <span className="text-right font-medium text-slate-950">{currentTransaction.utrNumber}</span>
            </div>
          )}
        </div>

        <a
          href={`/receipt/${currentTransaction.id}`}
          className="block w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          View Receipt
        </a>
      </div>
    );
  }

  if (currentTransaction.status === "CANCELLED" || currentTransaction.status === "FAILED") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-950">
          Payment {currentTransaction.status === "CANCELLED" ? "Cancelled" : "Failed"}
        </h2>
        <p className="text-slate-500">This payment request is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <header className="mb-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-950">Secure Payment</h1>
            <p className="flex items-center justify-center gap-1 text-sm text-slate-500 sm:justify-start">
              This is a secured payment link <Lock size={13} className="text-emerald-600" />
            </p>
          </div>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
          UPI Checkout
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            {businessProfile.logoUrl ? (
              <img
                src={businessProfile.logoUrl}
                alt={businessProfile.name}
                className="h-24 w-24 rounded-2xl border border-slate-100 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-4xl font-black text-white shadow-sm">
                A
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-950">{businessProfile.name}</h2>
                <BadgeCheck size={22} className="text-blue-600" />
              </div>
              <p className="mt-2 text-sm text-slate-500">Business Consulting Services</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                  <Building2 size={15} /> Verified business
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  <ShieldCheck size={15} /> Secure UPI payment
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 py-8 md:grid-cols-[1fr_260px]">
            <div>
              <p className="text-sm font-semibold text-slate-600">Amount Payable</p>
              <p className="mt-3 text-5xl font-extrabold text-blue-700">₹{currentTransaction.amount.toFixed(2)}</p>
              <p className="mt-3 text-sm text-slate-500">Pay securely using any UPI app.</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <ShieldCheck size={18} /> Payment secured by encrypted UPI link
              </div>
            </div>

            <div className="space-y-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex gap-3">
                <FileText size={20} className="mt-0.5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Order ID</p>
                  <p className="break-all font-semibold text-slate-950">{currentTransaction.orderId}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CalendarDays size={20} className="mt-0.5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Created On</p>
                  <p className="font-semibold text-slate-950">{createdOn}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Smartphone size={20} className="mt-0.5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-semibold text-slate-950">{currentTransaction.customerName}</p>
                </div>
              </div>
            </div>
          </div>

          {currentTransaction.purpose && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Note:</span> {currentTransaction.purpose}
            </div>
          )}
        </section>

        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-gradient-to-r from-blue-600 to-violet-700 px-5 py-4 text-center text-base font-bold text-white">
            Scan & Pay with any UPI App
          </div>
          <div className="p-6">
            <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <QRCodeSVG value={activeUpiUrl} size={245} level="H" includeMargin={true} />
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {upiApps.map((app) => (
                <a
                  key={app.label}
                  href={activeUpiUrl}
                  title={app.label}
                  className="flex min-h-12 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-extrabold ${app.className}`}>
                    {app.short}
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">UPI ID</p>
                <p className="truncate text-sm font-semibold text-slate-950">{activeUpiId}</p>
              </div>
              <button
                onClick={copyUpiId}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-blue-600"
                title="Copy UPI ID"
              >
                {copied ? <Check size={17} className="text-emerald-600" /> : <Copy size={17} />}
              </button>
            </div>

            <a
              href={activeUpiUrl}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-700 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition-opacity hover:opacity-95"
            >
              <IndianRupee size={19} /> Pay ₹{currentTransaction.amount.toFixed(2)}
              <ExternalLink size={18} />
            </a>

            {isHighValuePayment && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                If your UPI app shows a safety warning, scan this QR directly from your UPI app.
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={24} />
            <div>
              <p className="font-bold text-slate-950">100% Secure</p>
              <p className="text-slate-500">Encrypted UPI payment</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={24} />
            <div>
              <p className="font-bold text-slate-950">Fast & Instant</p>
              <p className="text-slate-500">Quick payment confirmation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="text-violet-700" size={24} />
            <div>
              <p className="font-bold text-slate-950">Support</p>
              <p className="text-slate-500">Finance team assistance</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-8 text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
          <span>Powered by</span>
          <span className="inline-flex items-center gap-2 font-bold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">A</span>
            Axienta Business Consulting Finance
          </span>
        </div>
      </footer>
    </div>
  );
}
