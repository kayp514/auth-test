'use client'

import { useAuth } from "@tern-secure/nextjs";

export default function Home() {
  const { userId, isSignedIn } = useAuth();

  if(!isSignedIn){
    return <h1>Not signed in</h1>
  }
  console.log('userId', userId);
  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
