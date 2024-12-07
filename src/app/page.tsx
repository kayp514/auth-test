'use client'

import { useAuth} from "@tern-secure/nextjs";
import { redirect } from "next/navigation";

export default function Home() {
  const  { user, isLoaded, isAuthenticated }  = useAuth();


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
