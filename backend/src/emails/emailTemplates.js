

export function createWelcomeEmailTemplate(name, clientURL) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Chatify</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(to right, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600;">💬 Chatify</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Real-time messaging powered by AI</p>
    </div>
    <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 18px; color: #6366f1;"><strong>Hello ${name}! 👋</strong></p>
      <p>We're thrilled to have you join Chatify! Get ready to experience seamless real-time messaging with AI-powered features.</p>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #6366f1;">
        <p style="font-size: 16px; margin: 0 0 15px 0;"><strong>What you can do with Chatify:</strong></p>
        <ul style="padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 10px;">💬 Send messages, photos, videos & voice notes</li>
          <li style="margin-bottom: 10px;">👥 Create and join group chats</li>
          <li style="margin-bottom: 10px;">🤖 Chat with AI for smart assistance</li>
          <li style="margin-bottom: 10px;">📊 Create polls in groups</li>
          <li style="margin-bottom: 0;">📍 Share your location</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${clientURL}" style="background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 35px; border-radius: 50px; font-weight: 600; display: inline-block; font-size: 16px;">Start Chatting →</a>
      </div>
      
      <p style="margin-bottom: 5px;">Need help? Reply to this email or reach out anytime.</p>
      <p style="margin-top: 0;">Happy messaging! 🚀</p>
      
      <p style="margin-top: 25px; margin-bottom: 0;">Best regards,<br><strong>The Chatify Team</strong></p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p>© 2026 Chatify. All rights reserved.</p>
      <p>
        <a href="${clientURL}" style="color: #6366f1; text-decoration: none;">Visit Chatify</a>
      </p>
    </div>
  </body>
  </html>
  `;
}