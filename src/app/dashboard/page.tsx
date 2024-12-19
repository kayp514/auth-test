'use client'

import { redirect } from "next/navigation";
//import { useAuth } from "../providers/hooks/useAuth";
//import { useAuth } from '@tern-secure/nextjs'



export default function Dashboard() {
//const {  user, isLoaded, isAuthenticated } = useAuth();




    const handleHome = () => {
        redirect('/');
    }


  return (
    <div>
      <h1>Dashboard,  </h1>
      <button className="bg-fuchsia-600" onClick={handleHome}>Home</button>
    </div>
  );
}