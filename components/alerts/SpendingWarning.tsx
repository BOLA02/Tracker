'use client';
import { useEffect, useState } from 'react';

type Props = {
  category: string;
  budget: number;
  totalSpent: number;
};

export default function SpendingWarning({ category, budget, totalSpent }: Props) {
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const todayDay = today.getDate();

    const expectedSpend = (budget / daysInMonth) * todayDay;

    if (totalSpent > expectedSpend * 1.2) {
      const overspend = totalSpent - expectedSpend;
      setWarning(
        `🚨 You’re overspending in ${category}. ₦${overspend.toFixed(2)} over expected.`
      );
    } else {
      setWarning(null); // ✅ clear it when not overspending
    }
  }, [category, budget, totalSpent]);

  if (!warning) return null;

  return (
    <p className="text-sm text-red-600 mt-1 bg-red-50 border border-red-300 p-2 rounded">
      {warning}
    </p>
  );
}
