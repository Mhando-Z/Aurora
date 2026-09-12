import { redirect } from "next/navigation";
import CheckEmail from "./Checkemail";

export default async function CheckEmailPage({ searchParams }) {
  const params = await searchParams;

  const email = params?.email || "";

  if (!email) {
    redirect("/register");
  }

  return <CheckEmail email={email} />;
}
