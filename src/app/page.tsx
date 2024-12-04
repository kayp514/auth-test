'use client'

import { useAuth } from "@tern-secure/nextjs";
import { redirect } from "next/navigation";

export default function Home() {
  const { userId, isSignedIn } = useAuth();

  if(!isSignedIn){
    redirect('/sign-in');
  }

  console.log('userId', userId);
  return (
    <div>
      <h1>Home, Home</h1>
    </div>
  );
}
