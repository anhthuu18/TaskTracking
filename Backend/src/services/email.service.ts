import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Sử dụng Gmail SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
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

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tasktracking.com';
      
      await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });

      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
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
            ${customMessage ? `<p><em>Tin nhắn: ${customMessage}</em></p>` : ''}
            <p>Nhấp vào nút bên dưới để chấp nhận lời mời:</p>
            <a href="${acceptUrl}" class="button">Chấp nhận lời mời</a>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p><a href="${acceptUrl}">${acceptUrl}</a></p>
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
            ${customMessage ? `<p><em>Tin nhắn: ${customMessage}</em></p>` : ''}
            <p><strong>Lưu ý:</strong> Bạn cần là thành viên của workspace "${workspaceName}" trước khi có thể tham gia project này.</p>
            <p>Nhấp vào nút bên dưới để chấp nhận lời mời:</p>
            <a href="${acceptUrl}" class="button">Chấp nhận lời mời</a>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p><a href="${acceptUrl}">${acceptUrl}</a></p>
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
}
