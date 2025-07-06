'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const categories = ['Transport', 'Food', 'Bills', 'Shopping', 'Health', 'Other'];

export default function BudgetForm() {
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState('');
  const [existingBudget, setExistingBudget] = useState<number | null>(null);
  const [monthlySpent, setMonthlySpent] = useState<number>(0);
  const [message, setMessage] = useState('');

  // 🔁 Fetch existing budget and this month's spending for selected category
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get budget (amount) for this category
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category', category)
        .single();

      setExistingBudget(budgetData?.amount || null);

      // 2. Get transactions in this category for this month
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      const { data: txData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category', category)
        .gte('date', startOfMonth);

      const total = txData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      setMonthlySpent(total);
    };

    fetchData();
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setMessage('User not logged in');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return setMessage('Please enter a valid number');

    // 🔁 Insert or update using upsert
    const { error } = await supabase
      .from('budgets')
            .upsert(
        [
            {
            user_id: user.id,
            category,
            amount: parsedAmount,
            },
        ],
        {
            onConflict: 'user_id,category', 
        }
        );


    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage('✅ Budget saved!');
      setExistingBudget(parsedAmount);
      setAmount('');
    }
  };

  const remaining = existingBudget !== null ? existingBudget - monthlySpent : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded max-w-md mx-auto">
      <h2 className="text-lg font-bold">Set or Update Monthly Budget</h2>

      <label className="block">
        <span className="text-sm font-medium">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Monthly Budget (₦)</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={existingBudget !== null ? `Current: ₦${existingBudget}` : 'Enter budget'}
          className="w-full mt-1 p-2 border rounded"
        />
      </label>

      {existingBudget !== null && (
        <div className="text-sm text-gray-700">
          <p>💰 Existing Budget: ₦{existingBudget.toFixed(2)}</p>
          <p>💸 Spent This Month: ₦{monthlySpent.toFixed(2)}</p>
          <p>
            🧮 Remaining:{" "}
            <span className={remaining! < 0 ? 'text-red-600 font-semibold' : 'font-medium'}>
              ₦{remaining!.toFixed(2)}
            </span>
          </p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Save Budget
      </button>

      {message && <p className="text-center text-sm mt-2">{message}</p>}
    </form>
  );
}