import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const interest = String(body.interest || "").trim();
    const message = String(body.message || "").trim();

    if (body.website) return NextResponse.json({ ok: true });
    if (name.length < 2 || name.length > 80 || !emailPattern.test(email) || email.length > 120 || !interest || message.length < 20 || message.length > 2000) {
      return NextResponse.json({ message: "Please check the form and complete every field." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !to) {
      return NextResponse.json({ message: "The contact form is being connected. For now, email hello@agentsiraji.com." }, { status: 503 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.CONTACT_FROM_EMAIL || "AgentSiraji Website <onboarding@resend.dev>", to: [to], reply_to: email, subject: `New AgentSiraji inquiry: ${interest}`, text: `Name: ${name}\nEmail: ${email}\nInterest: ${interest}\n\n${message}` })
    });
    if (!response.ok) throw new Error("Email service rejected the request");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unable to send right now. Please email hello@agentsiraji.com." }, { status: 500 });
  }
}
