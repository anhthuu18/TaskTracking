import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Sử dụng Gmail SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWorkspaceInvitation(
    email: string,
    workspaceName: string,
    inviterName: string,
    acceptUrl: string,
    customMessage?: string
  ): Promise<void> {
    const subject = `Lời mời tham gia workspace: ${workspaceName}`;
    const html = this.generateWorkspaceInvitationHTML(
      workspaceName,
      inviterName,
      acceptUrl,
      customMessage
    );

    await this.sendEmail(email, subject, html);
  }

  async sendProjectInvitation(
    email: string,
    projectName: string,
    workspaceName: string,
    inviterName: string,
    acceptUrl: string,
    customMessage?: string
  ): Promise<void> {
    const subject = `Lời mời tham gia project: ${projectName}`;
    const html = this.generateProjectInvitationHTML(
      projectName,
      workspaceName,
      inviterName,
      acceptUrl,
      customMessage
    );

    await this.sendEmail(email, subject, html);
  }

  async sendProjectNotification(
    email: string,
    projectName: string,
    workspaceName: string,
    inviterName: string,
    customMessage?: string
  ): Promise<void> {
    const subject = `Thông báo: Bạn đã được thêm vào project ${projectName}`;
    const html = this.generateProjectNotificationHTML(
      projectName,
      workspaceName,
      inviterName,
      customMessage
    );

    await this.sendEmail(email, subject, html);
  }

  async sendTaskReminder(
    email: string,
    taskName: string,
    projectName: string,
    dueDate: Date
  ): Promise<void> {
    const subject = `⏰ Nhắc nhở: Task "${taskName}" sắp đến hạn`;
    const html = this.generateTaskReminderHTML(taskName, projectName, dueDate);

    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      const fromEmail =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        "noreply@tasktracking.com";

      await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private generateWorkspaceInvitationHTML(
    workspaceName: string,
    inviterName: string,
    acceptUrl: string,
    customMessage?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lời mời tham gia Workspace</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border: 1px solid #ddd; }
          .header { background: #ffd966; padding: 15px 20px; border-bottom: 2px solid #f1c232; }
          .header h2 { margin: 0; color: #333; font-size: 18px; }
          .content { padding: 20px; }
          .button { display: inline-block; padding: 10px 20px; background: #4caf50; color: white; text-decoration: none; border-radius: 3px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Lời mời tham gia Workspace</h2>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã mời bạn tham gia workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p>Tin nhắn: <em>${customMessage}</em></p>` : ""}
            <p>Nhấp vào nút bên dưới để chấp nhận lời mời:</p>
            <a href="${acceptUrl}" class="button">Chấp nhận lời mời</a>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${acceptUrl}</p>
            <p>Lời mời này sẽ hết hạn sau 7 ngày.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateProjectInvitationHTML(
    projectName: string,
    workspaceName: string,
    inviterName: string,
    acceptUrl: string,
    customMessage?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lời mời tham gia Project</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border: 1px solid #ddd; }
          .header { background: #ffd966; padding: 15px 20px; border-bottom: 2px solid #f1c232; }
          .header h2 { margin: 0; color: #333; font-size: 18px; }
          .content { padding: 20px; }
          .button { display: inline-block; padding: 10px 20px; background: #4caf50; color: white; text-decoration: none; border-radius: 3px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Lời mời tham gia Project</h2>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã mời bạn tham gia project <strong>"${projectName}"</strong> trong workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p>Tin nhắn: <em>${customMessage}</em></p>` : ""}
            <p><strong>Lưu ý:</strong> Bạn cần là thành viên của workspace "${workspaceName}" trước khi có thể tham gia project này.</p>
            <p>Nhấp vào nút bên dưới để chấp nhận lời mời:</p>
            <a href="${acceptUrl}" class="button">Chấp nhận lời mời</a>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${acceptUrl}</p>
            <p>Lời mời này sẽ hết hạn sau 7 ngày.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateProjectNotificationHTML(
    projectName: string,
    workspaceName: string,
    inviterName: string,
    customMessage?: string
  ): string {
    const currentDate = new Date();
    const sentDate = currentDate.toLocaleDateString("vi-VN");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lời mời tham gia Project</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border: 1px solid #ddd; }
          .header { background: #ffd966; padding: 15px 20px; border-bottom: 2px solid #f1c232; }
          .header h2 { margin: 0; color: #333; font-size: 18px; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Lời mời tham gia project</h2>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã mời bạn tham gia project <strong>"${projectName}"</strong> trong workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p>Tin nhắn: <em>${customMessage}</em></p>` : ""}
            <p><strong>Lưu ý:</strong> Bạn cần là thành viên của workspace "${workspaceName}" trước khi có thể tham gia project này.</p>
            <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 14px; color: #666;">Gửi: ${sentDate}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTaskReminderHTML(
    taskName: string,
    projectName: string,
    dueDate: Date
  ): string {
    const dueDateStr = dueDate.toLocaleDateString("vi-VN");
    const dueTimeStr = dueDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const currentDate = new Date();
    const sentDate = currentDate.toLocaleDateString("vi-VN");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Task sắp đến deadline</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border: 1px solid #ddd; }
          .header { background: #ffd966; padding: 15px 20px; border-bottom: 2px solid #f1c232; }
          .header h2 { margin: 0; color: #333; font-size: 18px; }
          .content { padding: 20px; }
          .task-info { background: #fffbf0; padding: 15px; border-left: 3px solid #f1c232; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Task sắp đến deadline</h2>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p>Task <strong>${taskName}</strong> sắp đến deadline.</p>
            
            <div class="task-info">
              <p style="margin: 5px 0;">📋 <strong>${taskName}</strong></p>
              <p style="margin: 5px 0;">📁 Project: ${projectName}</p>
              <p style="margin: 5px 0;">⏱️ Hạn chót: ${dueDateStr} lúc ${dueTimeStr}</p>
            </div>
            
            <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 14px; color: #666;">Gửi: ${sentDate}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
