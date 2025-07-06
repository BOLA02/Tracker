import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader)
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user)
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const user_id = userData.user.id;
  const { amount, category, date, description } = await request.json();

  if (!amount || !category || !date)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  // 🧠 STEP 1: Get the user's budget for this category
  const { data: budget } = await supabaseAdmin
    .from('budgets')
    .select('amount')
    .eq('user_id', user_id)
    .eq('category', category)
    .single();

  if (!budget)
    return NextResponse.json({ error: `No budget found for category: ${category}` }, { status: 400 });

  // 🧠 STEP 2: Get total spent this month in this category
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .eq('user_id', user_id)
    .eq('category', category)
    .gte('date', startOfMonth);

  const spent = transactions?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

  // 🧠 STEP 3: Check if debit would exceed the budget
  const remaining = budget.amount - spent;

  if (parseFloat(amount) > remaining) {
    return NextResponse.json(
      {
        error: `🚫 Insufficient funds. Your remaining ${category} budget is ₦${remaining.toFixed(2)}, but you're trying to debit ₦${amount}`,
      },
      { status: 400 }
    );
  }

  // ✅ STEP 4: Save the transaction (as a debit)
  const { data: tx, error: txError } = await supabaseAdmin
    .from('transactions')
    .insert([
      {
        user_id,
        category,
        amount: -Math.abs(amount), // Ensure it's negative
        date,
        description,
      },
    ])
    .select()
    .single();

  if (txError)
    return NextResponse.json({ error: txError.message }, { status: 500 });

  return NextResponse.json(tx, { status: 201 });
}
