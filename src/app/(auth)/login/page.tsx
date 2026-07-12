import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-3">
        <Image src="/icons/cricket.svg" alt="" width={40} height={40} priority />
        <span className="font-display text-3xl font-extrabold tracking-tight">jiminee</span>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
