"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function loginAction(
  email: string,
  password: string
): Promise<{ error: string } | never> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.detail ?? "Login failed" };
  }

  const data = await res.json();

  (await cookies()).set("token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}

export async function signupAction(
  username: string,
  email: string,
  password: string
): Promise<{ error: string } | never> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.detail ?? "Signup failed" };
  }

  redirect("/login");
}

export async function logoutAction(): Promise<never> {
  (await cookies()).delete("token");
  redirect("/login");
}
