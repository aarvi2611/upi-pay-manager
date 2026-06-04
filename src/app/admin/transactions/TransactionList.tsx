"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Copy, Edit, ExternalLink, Save, Trash2, X, XCircle } from "lucide-react";

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
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

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

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editingTransaction.customerName,
          customerPhone: editingTransaction.customerPhone,
          amount: editingTransaction.amount,
          purpose: editingTransaction.purpose,
          status: editingTransaction.status,
          utrNumber: editingTransaction.utrNumber,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Error: ${err}`);
        return;
      }

      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTransaction(null);
    } catch (error) {
      alert("Failed to edit transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction permanently?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Error: ${err}`);
        return;
      }

      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (error) {
      alert("Failed to delete transaction");
    }
  };

  const handleDeleteVisible = async () => {
    if (filteredData.length === 0) return;
    if (!confirm(`Delete ${filteredData.length} visible transaction(s) permanently?`)) return;

    const ids = filteredData.map((tx) => tx.id);
    await Promise.all(ids.map((id) => fetch(`/api/transactions/${id}`, { method: "DELETE" })));
    setTransactions((prev) => prev.filter((tx) => !ids.includes(tx.id)));
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
        <button
          onClick={handleDeleteVisible}
          disabled={filteredData.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} /> Delete Visible
        </button>
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
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {tx.upiTarget === "PERSONAL" ? "Personal UPI" : "Merchant UPI"}
                  </div>
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
                  <div className="flex flex-wrap gap-2">
                    {tx.status === 'PENDING' && (
                      <>
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
                      </>
                    )}
                    <button
                      onClick={() => setEditingTransaction({ ...tx, amount: tx.amount.toString() })}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                    {tx.status === 'PAID' && (
                      <a href={`/receipt/${tx.id}`} target="_blank" className="text-sm text-blue-600 hover:underline">
                        View Receipt
                      </a>
                    )}
                  </div>
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
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Transaction</h2>
              <button
                onClick={() => setEditingTransaction(null)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Customer Name
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.customerName || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, customerName: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Customer Phone
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.customerPhone || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, customerPhone: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.amount || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Status
                <select
                  className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
                  value={editingTransaction.status || "PENDING"}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, status: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                UTR Number
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editingTransaction.utrNumber || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, utrNumber: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                Purpose / Note
                <textarea
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                  value={editingTransaction.purpose || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, purpose: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingTransaction(null)}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
