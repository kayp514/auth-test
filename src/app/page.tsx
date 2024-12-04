'use client'

import { useAuth } from "@tern-secure/nextjs";
import { redirect } from "next/navigation";

export default function Home() {
  const { userId, isSignedIn } = useAuth();

  if(!isSignedIn){
    redirect('/sign-in');
  }

  const handleDashboard = () => {
    redirect('/dashboard');
  }


  return (
    <div>
      <h1>Home, {userId}</h1>
      <button className="bg-fuchsia-600" onClick={handleDashboard}>Dashboard</button>
    </div>
  );
}
