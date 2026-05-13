import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />;
}
