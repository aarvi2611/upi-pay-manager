"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ upiId: "", personalUpiId: "" });
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    amount: "",
    purpose: "",
    upiTarget: "MERCHANT",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          upiId: data?.upiId || "",
          personalUpiId: data?.personalUpiId || "",
        });
      })
      .catch((error) => console.error("Failed to load business profile", error));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create transaction");
      
      const data = await res.json();
      router.push(`/admin/transactions?created=${data.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error creating transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Payment Link</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receive Payment In</label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, upiTarget: "MERCHANT" })}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  formData.upiTarget === "MERCHANT"
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="block text-sm font-semibold">Merchant UPI</span>
                <span className="mt-1 block text-xs text-gray-500">{profile.upiId || "Configured merchant UPI"}</span>
              </button>
              <button
                type="button"
                disabled={!profile.personalUpiId}
                onClick={() => setFormData({ ...formData, upiTarget: "PERSONAL" })}
                className={`rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  formData.upiTarget === "PERSONAL"
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="block text-sm font-semibold">Personal UPI</span>
                <span className="mt-1 block text-xs text-gray-500">
                  {profile.personalUpiId || "Add personal UPI in profile first"}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purpose / Note</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Generating..." : "Generate Link & QR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
