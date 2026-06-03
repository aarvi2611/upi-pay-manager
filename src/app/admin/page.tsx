import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";

export default async function AdminDashboard() {
  const transactions = await prisma.transaction.findMany();
  
  const totalReceived = transactions
    .filter(t => t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const pendingAmount = transactions
    .filter(t => t.status === "PENDING")
    .reduce((acc, t) => acc + t.amount, 0);

  const today = new Date();
  const todayTransactions = transactions.filter(t => {
    const txDate = new Date(t.createdAt);
    return txDate.getDate() === today.getDate() &&
           txDate.getMonth() === today.getMonth() &&
           txDate.getFullYear() === today.getFullYear();
  });

  const todayCollection = todayTransactions
    .filter(t => t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCount = transactions.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Received"
          value={`₹${totalReceived.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <DashboardCard
          title="Pending Amount"
          value={`₹${pendingAmount.toFixed(2)}`}
          icon={Activity}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <DashboardCard
          title="Today's Collection"
          value={`₹${todayCollection.toFixed(2)}`}
          icon={CreditCard}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <DashboardCard
          title="Total Transactions"
          value={totalCount.toString()}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{tx.orderId}</td>
                  <td className="px-6 py-4">{tx.customerName}</td>
                  <td className="px-6 py-4">₹{tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">{format(new Date(tx.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      tx.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${bgColor} ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
