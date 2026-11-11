import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 text-2xl font-bold">
            HabitBot
          </div>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}