import { SignIn } from "@tern-secure/nextjs"
//import { SignIn } from "../../providers/components/sign-in-construct-v2"

export default function Page() {
  return <SignIn initialValues={{ phoneNumber: '' }} />
}