import { redirect } from "next/navigation";
//import { useAuth } from "../providers/hooks/useAuth";
//import { useAuth } from '@tern-secure/nextjs'
import { auth } from "../providers/server/auth";
import Link from "next/link";



export default async function Dashboard() {
const {  user } = await auth();

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
    </div>
  );
}