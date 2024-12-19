'use client'

import { redirect } from "next/navigation";
import { useAuth } from "../providers/hooks/useAuth";
//import { useAuth } from '@tern-secure/nextjs'



export default function Dashboard() {
const {  user, isLoaded, isAuthenticated } = useAuth();

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div>You are not authenticated.</div>;
    }


    const handleHome = () => {
        redirect('/');
    }


  return (
    <div>
      <h1>Dashboard, {user?.email} </h1>
      <button className="bg-fuchsia-600" onClick={handleHome}>Home</button>
    </div>
  );
}