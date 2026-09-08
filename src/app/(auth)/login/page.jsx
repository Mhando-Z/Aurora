import LoginClient from "./LoginClient";

export const metadata = {
  title: "Login - Aurora",
  description: "Sign in to your Aurora account.",
};

function safeNext(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/account";
  }

  return value;
}

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  const error = params?.error;
  const next = safeNext(params?.next);

  return <LoginClient error={error} next={next} />;
}
