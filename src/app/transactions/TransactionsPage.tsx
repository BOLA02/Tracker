'use client'

import { useEffect, useState } from 'react';
import { Plus, Calendar, Tag, DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import {supabase} from '../../../lib/supabaseClient'

type Props = {
  session: any;
};

type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
};

export default function TransactionsPage({ session }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    amount: '',
    category: '',
    date: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/transactions')
      .then((res) => res.json())
      .then(setTransactions);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!session) {
      alert('Please login first');
      setLoading(false);
      return;
    }

    const token = session.access_token;

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:`Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        description: form.description || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.error}`);
      setLoading(false);
      return;
    }

    const created = await res.json();
    setTransactions((prev) => [...prev, created]);
    setForm({ amount: '', category: '', date: '', description: '' });
    setShowForm(false);
    setLoading(false);
  }

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const positiveTransactions = transactions.filter(tx => tx.amount > 0);
  const negativeTransactions = transactions.filter(tx => tx.amount < 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Food': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Bills': 'bg-red-100 text-red-800',
      'Income': 'bg-green-100 text-green-800',
      'default': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction Dashboard</h1>
            <p className="text-gray-600">Track and manage your financial transactions</p>
            <button
              onClick={async() => {
              await supabase.auth.signOut()
              ;}}
              className= "bg-red-500 text-white px-4 py-2 rounded">
            SignOut</button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Total Balance</p>
                    <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalAmount)}
                    </p>
                </div>
                <div className={`p-3 rounded-full ${totalAmount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <DollarSign className={`w-6 h-6 ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                </div>
            </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(positiveTransactions.reduce((sum, tx) => sum + tx.amount, 0))}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(Math.abs(negativeTransactions.reduce((sum, tx) => sum + tx.amount, 0)))}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Transaction
          </button>
        </div>

            {/* Transaction Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Transaction</h2>
            <div onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Amount
                  </label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <input
                    name="category"
                    type="text"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Enter category"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Description
                  </label>
                  <input
                    name="description"
                    type="text"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter description (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? 'Adding...' : 'Add Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-gray-600 mt-1">{transactions.length} transactions total</p>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No transactions yet</p>
              <p className="text-gray-400">Add your first transaction to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-8 py-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${tx.amount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.amount >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(tx.category)}`}>
                            {tx.category}
                          </span>
                          <span className="text-sm text-gray-500">{formatDate(tx.date)}</span>
                        </div>
                        {tx.description && (
                          <p className="text-gray-600 text-sm">{tx.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
