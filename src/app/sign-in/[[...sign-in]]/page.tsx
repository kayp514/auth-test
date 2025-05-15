
import { SignIn } from "../../providers/components/sign-in-construct-v2"
//import { SignIn } from "@tern-secure/nextjs"

export default function Page() {
  return <SignIn redirectUrl="/dashboard"/>
}