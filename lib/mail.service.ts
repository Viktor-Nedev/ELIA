export const mailService = {
  /**
   * Mock implementation of sending an email.
   * In production, this would call a Cloud Function or a 3rd party API.
   */
  async sendEmail(to: string, subject: string, body: string) {
    console.log(`[MAIL SERVICE] Sending email to: ${to}`);
    console.log(`[MAIL SERVICE] Subject: ${subject}`);
    console.log(`[MAIL SERVICE] Body: ${body}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  },

  async notifyFriendRequest(toEmail: string, fromName: string) {
    return this.sendEmail(
      toEmail,
      "New Friend Request on ELIA",
      `Hi! ${fromName} wants to connect with you on ELIA. Log in to accept the request.`
    );
  },

  async notifyFriendAccepted(toEmail: string, fromName: string) {
    return this.sendEmail(
      toEmail,
      "Friend Request Accepted!",
      `${fromName} accepted your friend request on ELIA. You can now track each other's progress.`
    );
  },

  async sendWeeklyReport(toEmail: string, stats: any) {
    return this.sendEmail(
      toEmail,
      "Your Weekly Sustainability Impact",
      `Here is your summary for the week: ${JSON.stringify(stats)}`
    );
  },

  async notifyAchievementEarned(toEmail: string, userName: string, achievementName: string) {
    return this.sendEmail(
      toEmail,
      "Achievement Unlocked!",
      `Your friend ${userName} just earned the "${achievementName}" achievement on ELIA! Check out their progress and see if you can match it.`
    );
  }
};
