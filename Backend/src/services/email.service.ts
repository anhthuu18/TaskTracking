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

  async sendEventCreationNotification(
    email: string,
    eventName: string,
    projectName: string,
    creatorName: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ): Promise<void> {
    const subject = `📅 Event mới: ${eventName}`;
    const html = this.generateEventCreationHTML(
      eventName,
      projectName,
      creatorName,
      startTime,
      endTime,
      description
    );

    await this.sendEmail(email, subject, html);
  }

  async sendEventReminder(
    email: string,
    eventName: string,
    projectName: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ): Promise<void> {
    const subject = `⏰ Nhắc nhở Event: ${eventName}`;
    const html = this.generateEventReminderHTML(
      eventName,
      projectName,
      startTime,
      endTime,
      description
    );

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
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 { 
            margin: 0;
            color: #fff;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px;
            background: #fff;
          }
          .info-box {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 8px 0;
          }
          .button { 
            display: inline-block;
            padding: 14px 32px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
          }
          .button:hover {
            background: #5568d3;
          }
          .footer {
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
            background: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👥 Lời mời tham gia Workspace</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <div class="info-box">
              <p><strong>${inviterName}</strong> đã mời bạn tham gia workspace:</p>
              <p style="font-size: 18px; color: #667eea; font-weight: 600; margin: 12px 0;">🏢 ${workspaceName}</p>
              ${
                customMessage
                  ? `<p style="font-style: italic; color: #666; margin-top: 12px;">“${customMessage}”</p>`
                  : ""
              }
            </div>
            <p style="text-align: center;">
              <a href="${acceptUrl}" class="button">Chấp nhận lời mời</a>
            </p>
            <p style="color: #666; font-size: 14px;">Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #999; font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 4px;">${acceptUrl}</p>
          </div>
          <div class="footer">
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { padding: 20px; background: #fff; }
          .button { display: inline-block; padding: 12px 24px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Lời mời tham gia Project</h2>
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã mời bạn tham gia project <strong>"${projectName}"</strong> trong workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p>${customMessage}</p>` : ""}
            <p><a href="${acceptUrl}" class="button">Chấp nhận lời mời</a></p>
            <p>Hoặc copy link: <br/>${acceptUrl}</p>
            <p>Lưu ý: Bạn cần là thành viên của workspace "${workspaceName}" trước.</p>
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
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thông báo Project</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { padding: 20px; background: #fff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Thông báo Project</h2>
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> đã thêm bạn vào project <strong>"${projectName}"</strong> trong workspace <strong>"${workspaceName}"</strong>.</p>
            ${customMessage ? `<p>${customMessage}</p>` : ""}
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nhắc nhở Task</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 { 
            margin: 0;
            color: #fff;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px;
            background: #fff;
          }
          .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 8px 0;
          }
          .footer {
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
            background: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Nhắc nhở Task</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p>Task của bạn sắp đến hạn chót:</p>
            <div class="info-box">
              <p style="font-size: 18px; color: #333; font-weight: 600; margin-bottom: 12px;">📋 ${taskName}</p>
              <p><strong>📁 Project:</strong> ${projectName}</p>
              <p><strong>⏰ Hạn chót:</strong> ${dueDateStr} lúc ${dueTimeStr}</p>
            </div>
            <p style="color: #666;">Hãy hoàn thành task đúng hạn nhé!</p>
          </div>
          <div class="footer">
            <p>Đây là email tự động từ hệ thống quản lý task.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateEventCreationHTML(
    eventName: string,
    projectName: string,
    creatorName: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ): string {
    const startTimeStr = startTime.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTimeStr = endTime.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event mới</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 { 
            margin: 0;
            color: #fff;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px;
            background: #fff;
          }
          .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 8px 0;
          }
          .footer {
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
            background: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Event mới</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p><strong>${creatorName}</strong> vừa tạo event mới:</p>
            <div class="info-box">
              <p style="font-size: 18px; color: #333; font-weight: 600; margin-bottom: 12px;">📋 ${eventName}</p>
              <p><strong>📁 Project:</strong> ${projectName}</p>
              <p><strong>🕐 Bắt đầu:</strong> ${startTimeStr}</p>
              <p><strong>🕐 Kết thúc:</strong> ${endTimeStr}</p>
              ${
                description
                  ? `<p style="margin-top: 12px;"><strong>📝 Mô tả:</strong> ${description}</p>`
                  : ""
              }
            </div>
            <p style="color: #666;">Vui lòng sắp xếp thời gian tham gia.</p>
          </div>
          <div class="footer">
            <p>Đây là email tự động từ hệ thống quản lý sự kiện.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateEventReminderHTML(
    eventName: string,
    projectName: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ): string {
    const startTimeStr = startTime.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTimeStr = endTime.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nhắc nhở Event</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #ffd966 0%, #f1c232 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 { 
            margin: 0;
            color: #333;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px;
            background: #fff;
          }
          .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 8px 0;
          }
          .footer {
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
            background: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Nhắc nhở Event</h1>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p>Event sẽ diễn ra vào ngày mai:</p>
            <div class="info-box">
              <p style="font-size: 18px; color: #333; font-weight: 600; margin-bottom: 12px;">📋 ${eventName}</p>
              <p><strong>📁 Project:</strong> ${projectName}</p>
              <p><strong>🕐 Thời gian:</strong> ${startTimeStr} - ${endTimeStr}</p>
              ${
                description
                  ? `<p style="margin-top: 12px;"><strong>📝 Mô tả:</strong> ${description}</p>`
                  : ""
              }
            </div>
            <p style="color: #666;">Đừng quên tham gia nhé!</p>
          </div>
          <div class="footer">
            <p>Đây là email nhắc nhở tự động từ hệ thống.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
