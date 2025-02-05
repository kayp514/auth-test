import { useAuth } from "./providers/hooks/useAuth";
import { auth } from "./providers/server/auth-new";
//import { useAuth } from "@tern-secure/nextjs";
import { redirect } from "next/navigation";

export default async function Home() {
//const  { user, isAuthenticated, isLoaded }  = useAuth();
const { user } = await auth();
//console.log('User', user)
//console.log('isLoaded', isLoaded)
//console.log('isAuthenticated', isAuthenticated)

if(!user) {
  return null
}




  return (
    <div>
      <h1>Home, {user?.email}</h1>
      <h1>Home, {user?.uid}</h1>
      <button className="bg-fuchsia-600" >Dashboard</button>
    </div>
  );
}
