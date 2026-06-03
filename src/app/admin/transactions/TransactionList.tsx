"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, ExternalLink, CheckCircle, XCircle } from "lucide-react";

export default function TransactionList({
  initialData,
  publicBaseUrl,
}: {
  initialData: any[];
  publicBaseUrl: string;
}) {
  const [transactions, setTransactions] = useState(initialData);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = transactions.filter((tx) => {
    const matchesFilter = filter === "ALL" || tx.status === filter;
    const matchesSearch = 
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    let utrNumber = "";
    if (newStatus === "PAID") {
      utrNumber = prompt("Enter UTR Number for verification (optional):") || "";
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, utrNumber }),
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Error: ${err}`);
        return;
      }

      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const makePaymentLink = (id: string) => `${publicBaseUrl}/pay/${id}`;

  const copyLink = (id: string) => {
    const link = makePaymentLink(id);
    navigator.clipboard.writeText(link);
    alert("Payment link copied!");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name or Order ID..."
          className="px-4 py-2 border rounded-lg md:w-80 outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Order ID / Link</th>
              <th className="px-6 py-3">Customer Info</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{tx.orderId}</div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => copyLink(tx.id)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                      <Copy size={12} /> Copy Link
                    </button>
                    <a href={makePaymentLink(tx.id)} target="_blank" className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-xs">
                      <ExternalLink size={12} /> View
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{tx.customerName}</div>
                  <div className="text-gray-500 text-xs">{tx.customerPhone}</div>
                  {tx.purpose && <div className="text-gray-400 text-xs mt-1 truncate max-w-[150px]">{tx.purpose}</div>}
                </td>
                <td className="px-6 py-4 font-bold">₹{tx.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tx.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    tx.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tx.status}
                  </span>
                  {tx.utrNumber && <div className="text-[10px] text-gray-500 mt-1">UTR: {tx.utrNumber}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm')}
                </td>
                <td className="px-6 py-4">
                  {tx.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(tx.id, 'PAID')}
                        className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" title="Mark as Paid"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(tx.id, 'CANCELLED')}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Cancel"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                  {tx.status === 'PAID' && (
                    <a href={`/receipt/${tx.id}`} target="_blank" className="text-sm text-blue-600 hover:underline">
                      View Receipt
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
