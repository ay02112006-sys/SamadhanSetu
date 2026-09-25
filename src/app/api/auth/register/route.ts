// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { User, UserRole } from "@/types/user";

export async function POST(request: Request) {
  const { name, email, password, role } = await request.json();
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Normalize role to uppercase and validate
  const normalizedRole = role.toString().toUpperCase() as UserRole;
  const validRoles: UserRole[] = ["CITIZEN", "UNIVERSITY", "INDUSTRY", "GOVERNMENT"];
  if (!validRoles.includes(normalizedRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const db = await clientPromise;
  const users = db.collection("users");
  const existing = await users.findOne({ email: emailLower });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const passwordHash = await hash(password, 10);
  const newUser: User = {
    name,
    email: emailLower,
    passwordHash,
    role: normalizedRole,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await users.insertOne(newUser as Parameters<typeof users.insertOne>[0]);
  if (!result.acknowledged) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
