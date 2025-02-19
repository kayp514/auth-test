import { useAuth } from "./providers/hooks/useAuth";
import { auth } from "./providers/server/auth";
//import { useAuth } from "@tern-secure/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
//const  { user, isAuthenticated, isLoaded }  = useAuth();
const { user } = await auth();
//console.log('User', user)
//console.log('isLoaded', isLoaded)
//console.log('isAuthenticated', isAuthenticated)


  return (
    <div>
      <h1>Home, {user?.email}</h1>
      <h1>Home, {user?.uid}</h1>
      <Link 
        href="/dashboard"
        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded transition-colors inline-block mt-4"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
