'use client'

import { redirect } from "next/navigation";
import { useAuth } from "../providers/hooks/useAuth";
//import { useAuth } from '@tern-secure/nextjs'



export default function Dashboard() {
const {  user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <div>Loading...</div>;
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