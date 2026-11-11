"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/providers/auth-provider";

export function LoginForm() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      await login({
        email,
        password,
      });

      window.location.href = "/dashboard";
    } catch (error: any) {
      setError(
        error?.response?.data?.error?.message ??
          "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue your HabitBot journey.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? "Signing in..."
            : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}