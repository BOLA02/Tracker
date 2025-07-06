'use client'

import { useEffect, useState } from "react"
import {supabase} from '../../lib/supabaseClient'
import type {Session} from '@supabase/supabase-js'
import TransactionsPage from "../app/transactions/TransactionsPage"
import LoginForm from "../../components/login/LoginForm"
import { useStyleRegistry } from "styled-jsx"

export default function HomePae(){
  const [session, setSession] = useState<Session |null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // Step 1: get session on first load
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
    setLoading(false);
  });

  // Step 2: listen for auth state changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  // Step 3: cleanup listener
  return () => {
    subscription.unsubscribe(); // ✅ this is now defined
  };
}, []);

  if(loading) {
    return <p className="margin-auto">Loading....</p>;
  } 

  return session ? (
    <TransactionsPage session = {session} />
  ) : (
    <LoginForm />
  );
}