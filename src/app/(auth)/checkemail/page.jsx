import CheckEmail from "./Checkemail";

export default async function CheckEmailPage({ searchParams }) {
  const params = await searchParams;

  const email = params?.email || "";

  return <CheckEmail email={email} />;
}
