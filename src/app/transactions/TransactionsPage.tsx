'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import SpendingWarning from '../../../components/alerts/SpendingWarning';
import { 
  PlusCircle, 
  MinusCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CreditCard, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  LogOut,
  Wallet,
  Receipt,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

type Budget = {
  category: string;
  amount: number;
};

type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function TransactionsPage({ session }: { session: Session }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spentMap, setSpentMap] = useState<Record<string, number>>({});
  const [openFormCategory, setOpenFormCategory] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState({ category: 'Transport', amount: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: '',
  });

  // Toast functions
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    const newToast = { id, type, message };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Category icons
  const getCategoryIcon = (category: string) => {
    const icons = {
      Transport: '🚗',
      Food: '🍽️',
      Bills: '💡',
      Health: '⚕️',
      Other: '📦'
    };
    return icons[category as keyof typeof icons] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Transport: 'from-blue-500 to-blue-600',
      Food: 'from-green-500 to-green-600',
      Bills: 'from-yellow-500 to-yellow-600',
      Health: 'from-red-500 to-red-600',
      Other: 'from-purple-500 to-purple-600'
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch budgets
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('category, amount')
        .eq('user_id', user.id);

      if (budgetData) setBudgets(budgetData);

      // Fetch monthly spend
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .gte('date', startOfMonth);

      const map: Record<string, number> = {};
      transactions?.forEach((tx) => {
        const amt = Number(tx.amount);
        const cat = tx.category;
        map[cat] = (map[cat] || 0) + Math.abs(amt);
      });

      setSpentMap(map);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (data) setTransactions(data);
    };

    fetchTransactions();
  }, []);

  const handleDebit = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        date: new Date().toISOString().slice(0, 10),
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      addToast('error', result.error);
      return;
    }

    // Update spentMap directly
    const newSpentMap = { ...spentMap };
    const existingSpent = newSpentMap[form.category] || 0;
    const newSpent = existingSpent + Math.abs(parseFloat(form.amount));
    newSpentMap[form.category] = newSpent;
    setSpentMap(newSpentMap);

    // Reset form
    addToast('success', 'Transaction recorded successfully!');
    setForm({ amount: '', description: '', category: '' });
    setOpenFormCategory(null);
  };

  const handleBudgetSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const category = newBudget.category;
    const incoming = parseFloat(newBudget.amount);
    if (isNaN(incoming)) {
      addToast('error', 'Please enter a valid amount');
      return;
    }

    // Get current budget (if exists)
    const { data: existingBudget } = await supabase
      .from("budgets")
      .select("amount")
      .eq("user_id", user.id)
      .eq("category", category)
      .single();

    const current = existingBudget?.amount || 0;
    const total = current + incoming;

    // Save the new total
    const { error } = await supabase.from("budgets").upsert(
      [
        {
          user_id: user.id,
          category,
          amount: total,
        },
      ],
      { onConflict: "user_id,category" }
    );

    if (error) {
      addToast('error', error.message);
    } else {
      addToast('success', 'Budget updated successfully!');

      // Update budgets locally
      const updated = [...budgets];
      const existing = updated.find((b) => b.category === category);

      if (existing) {
        existing.amount = total;
      } else {
        updated.push({ category, amount: total });
      }

      setBudgets(updated);
      setNewBudget({ category: 'Transport', amount: '' });
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = Object.values(spentMap).reduce((sum, spent) => sum + spent, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : toast.type === 'error' 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <AlertCircle size={20} />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 hover:bg-white/20 rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Budget Manager</h1>
                <p className="text-gray-600">Track your expenses and stay on budget</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">₦{totalBudget.toFixed(2)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">₦{totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₦{(totalBudget - totalSpent).toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${totalBudget - totalSpent >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Budget Creation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <PlusCircle className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Create New Budget</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {['Transport', 'Food', 'Bills', 'Health', 'Other'].map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
                <input
                  type="number"
                  placeholder="Enter monthly budget amount"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleBudgetSave}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium"
              >
                Save Budget
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full mb-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Receipt className="text-gray-600" size={20} />
                <span className="text-lg font-semibold text-gray-900">Transaction History</span>
              </div>
              {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showHistory && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getCategoryIcon(tx.category)}</div>
                        <div>
                          <p className="font-medium text-gray-900">{tx.category}</p>
                          <p className="text-sm text-gray-500">{tx.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">₦{Math.abs(tx.amount).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Budget Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const spent = spentMap[budget.category] || 0;
            const remaining = budget.amount - spent;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const isOpen = openFormCategory === budget.category;

            return (
              <div key={budget.category} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${getCategoryColor(budget.category)}`}></div>
                <SpendingWarning
                  category={budget.category}
                  budget={budget.amount}
                  totalSpent={spent}
                />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(budget.category)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                        <p className="text-sm text-gray-500">Monthly Budget</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpenFormCategory(isOpen ? null : budget.category);
                        setForm({ amount: '', description: '', category: budget.category });
                      }}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <MinusCircle size={16} />
                      {isOpen ? 'Close' : 'Spend'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Budget</span>
                      <span className="font-medium">₦{budget.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-medium text-red-600">₦{spent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining</span>
                      <span className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₦{remaining.toFixed(2)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          percentage <= 75 ? 'bg-green-500' : 
                          percentage <= 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">{percentage.toFixed(1)}% used</p>
                  </div>

                  {isOpen && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                          type="number"
                          required
                          placeholder="Enter amount"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <input
                          type="text"
                          required
                          placeholder="What did you spend on?"
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={handleDebit}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium"
                      >
                        Record Expense
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}