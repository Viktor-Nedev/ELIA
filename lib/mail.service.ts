"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: true
  }
});

async function safeSendMail(options: any) {
  try {
    await transporter.verify();
    await transporter.sendMail(options);
    console.log(`[MAIL SERVICE] Email sent to ${options.to}`);
    return { success: true };
  } catch (err) {
    console.warn("[MAIL SERVICE] Email not sent (no local SMTP). Falling back to log.");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Body:", options.text);
    return { success: true, skipped: true };
  }
}

export const mailService = {
  async sendEmail(to: string, subject: string, body: string) {
    return safeSendMail({
      from: "ELIA <no-reply@elia.app>",
      to,
      subject,
      text: body
    });
  },

  async notifyFriendRequest(toEmail: string, fromName: string) {
    return this.sendEmail(
      toEmail,
      "New Friend Request on ELIA",
      `Hi!

${fromName} wants to connect with you on ELIA.

Log in to accept the request 🌱

– ELIA`
    );
  },

  async notifyFriendAccepted(toEmail: string, fromName: string) {
    return this.sendEmail(
      toEmail,
      "Friend Request Accepted!",
      `${fromName} accepted your friend request on ELIA 🎉

You can now track each other's progress.

– ELIA`
    );
  },

  async sendWeeklyReport(toEmail: string, stats: any) {
    return this.sendEmail(
      toEmail,
      "Your Weekly Sustainability Impact",
      `Your weekly summary:

${JSON.stringify(stats, null, 2)}

Keep going 🌍

– ELIA`
    );
  },

  async notifyAchievementEarned(
    toEmail: string,
    userName: string,
    achievementName: string
  ) {
    return this.sendEmail(
      toEmail,
      "Achievement Unlocked!",
      `${userName} just earned "${achievementName}" 🏆

Check it out in ELIA!

– ELIA`
    );
  }
};
