'use client'


//import { useAuth } from "@tern-secure/nextjs";
import { redirect } from "next/navigation";

export default function Home() {

//console.log('User', user)
//console.log('isLoaded', isLoaded)
//console.log('isAuthenticated', isAuthenticated)





  const handleDashboard = () => {
    redirect('/dashboard');
  }



  return (
    <div>
      <h1>Home, </h1>
      <button className="bg-fuchsia-600" onClick={handleDashboard}>Dashboard</button>
    </div>
  );
}
