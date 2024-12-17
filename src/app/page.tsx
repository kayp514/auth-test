'use client'

import { useAuth } from "./providers/hooks/useAuth";
import { redirect } from "next/navigation";

export default function Home() {
const  { user, isLoaded, isAuthenticated }  = useAuth();
//console.log('User', user)
//console.log('isLoaded', isLoaded)
//console.log('isAuthenticated', isAuthenticated)
    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div>You are not authenticated.</div>;
    }


  const handleDashboard = () => {
    redirect('/dashboard');
  }


  return (
    <div>
      <h1>Home, {user?.email}</h1>
      <button className="bg-fuchsia-600" onClick={handleDashboard}>Dashboard</button>
    </div>
  );
}
