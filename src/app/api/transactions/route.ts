import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import type { Database } from '@/types/supabase'; // optional if you have typed DB schema
type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
};
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase admin client (server-only, because it uses the secret key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// GET: fetch all transactions for all users (sorted by date desc)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: create a new transaction (requires user token in header)
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Invalid Authorization header format' }, { status: 401 });
  }

  // Verify user using the token
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const user_id = userData.user.id;

  const body = await request.json();
  const { amount, category, date, description } = body;

  if (!amount || !category || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert([{ user_id, amount, category, date, description }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
