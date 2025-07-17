import { redirect } from "next/navigation";
//import { useAuth } from "../providers/hooks/useAuth";
//import { useAuth } from '@tern-secure/nextjs'
//import { auth } from "../providers/server/auth";
import { auth } from "../providers/server/AuthNewWithClass";
import Link from "next/link";
import  { NotificationSender }  from '@/components/notifications'
import TestConnection from "@/components/test-connection";



export default async function Dashboard() {
const {  user } = await auth();
console.log('Dashboard user:', user);

const handleHomeClick = async () => {
  'use server';
  redirect('/');
};

  return (
    <div>
      <h1>Dashboard, {user?.email} </h1>
      <Link 
        href="/"
        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded transition-colors inline-block mt-4"
      >
        Go to Home
      </Link>

     <div>    
      <span> Send notification </span>
      <span className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded transition-colors inline-block mt-4"><NotificationSender /> </span>
      </div>

      <div>    
      <span> Test </span>
      <span className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded transition-colors inline-block mt-4"><TestConnection /> </span>
      </div>
    </div>
  );
}