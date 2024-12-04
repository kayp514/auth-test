'use client'
import {useAuth} from "@tern-secure/nextjs";
import { redirect } from "next/navigation";

export default function Dashboard() {
    const { userId, isSignedIn } = useAuth();
    
    if(!isSignedIn){
        redirect('/sign-in');
    }

  return (
    <div>
      <h1>Dashboard, {userId}</h1>
    </div>
  );
}