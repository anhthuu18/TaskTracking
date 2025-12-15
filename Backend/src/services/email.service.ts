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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lời mời tham gia Workspace</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã mời bạn tham gia workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p><em>Tin nhắn: ${customMessage}</em></p>` : ""}
            <p>Nhấp vào nút bên dưới để chấp nhận lời mời:</p>
            <a href="${acceptUrl}" class="button">Chấp nhận lời mời</a>
            <p>Lời mời này sẽ hết hạn sau 7 ngày.</p>
          </div>
          <div class="footer">
            <p>© 2024 Task Tracking System. All rights reserved.</p>
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lời mời tham gia Project</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã mời bạn tham gia project <strong>"${projectName}"</strong> trong workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p><em>Tin nhắn: ${customMessage}</em></p>` : ""}
            <p><strong>Lưu ý:</strong> Bạn cần là thành viên của workspace "${workspaceName}" trước khi có thể tham gia project này.</p>
            <p>Nhấp vào nút bên dưới để chấp nhận lời mời:</p>
            <a href="${acceptUrl}" class="button">Chấp nhận lời mời</a>
            <p>Lời mời này sẽ hết hạn sau 7 ngày.</p>
          </div>
          <div class="footer">
            <p>© 2024 Task Tracking System. All rights reserved.</p>
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
        <title>Thông báo Project</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .date-info { margin-top: 20px; padding: 10px; background: #e9ecef; border-radius: 5px; text-align: right; }
          .sent-date { font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thông báo Project</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã thêm bạn vào project <strong>"${projectName}"</strong> trong workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p><em>Tin nhắn: ${customMessage}</em></p>` : ""}
            <p>Bạn có thể truy cập project này ngay bây giờ.</p>
            
            <div class="date-info">
              <span class="sent-date">Gửi: ${sentDate}</span>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Task Tracking System. All rights reserved.</p>
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
        <title>Nhắc nhở Task</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-info { background: white; padding: 15px; border-left: 4px solid #ff6b6b; margin: 20px 0; }
          .task-name { font-size: 18px; font-weight: bold; color: #ff6b6b; }
          .due-date { font-size: 16px; color: #e63946; margin-top: 10px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .date-info { margin-top: 20px; padding: 10px; background: #e9ecef; border-radius: 5px; text-align: right; }
          .sent-date { font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Nhắc nhở Task</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p>Task của bạn sắp đến hạn!</p>
            
            <div class="task-info">
              <div class="task-name">📋 ${taskName}</div>
              <div>📁 Project: <strong>${projectName}</strong></div>
              <div class="due-date">⏱️ Hạn chót: ${dueDateStr} lúc ${dueTimeStr}</div>
            </div>
            
            <p>Hãy hoàn thành task trước khi hết hạn nhé!</p>
            
            <div class="date-info">
              <span class="sent-date">Gửi: ${sentDate}</span>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Task Tracking System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
