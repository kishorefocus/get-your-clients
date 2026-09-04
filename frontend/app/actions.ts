"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTeammateInviteEmail(email: string, inviteUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "GlobalReach <onboarding@resend.dev>",
      to: email,
      subject: "Join your team on GlobalReach",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2451FF; margin-top: 0;">Welcome to GlobalReach!</h2>
          <p>You have been invited to join your teammate workspace on GlobalReach.</p>
          <p>Click the link below to set up your account and get started:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #2451FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Teammate Workspace</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="color: #2451FF; font-size: 12px; word-break: break-all; margin-top: 0;">${inviteUrl}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error("Resend catch error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendClientOutreachEmail(toEmail: string, subject: string, messageHtml: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "GlobalReach Outreach <onboarding@resend.dev>",
      to: toEmail,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          ${messageHtml.replace(/\n/g, "<br />")}
        </div>
      `,
    });

    if (error) {
      console.error("Resend client outreach error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error("Resend client outreach catch error:", error);
    return { success: false, error: error.message };
  }
}
