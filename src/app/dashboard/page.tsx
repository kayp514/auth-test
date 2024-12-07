'use client'

import { redirect } from "next/navigation";
import { useAuth } from "@tern-secure/nextjs";


export default function Dashboard() {
const {  user } = useAuth();


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