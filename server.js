require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '.')));

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// API endpoint for contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, service, budget, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    // 1. Email notification to administrator
    const adminMailOptions = {
      from: process.env.FROM_EMAIL,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Lead: ${name} - ${service || 'General Inquiry'}`,
      text: `
        You have received a new contact form submission from NORTRADE website:
        
        Name: ${name}
        Email: ${email}
        Company: ${company || 'N/A'}
        Service Requested: ${service || 'N/A'}
        Budget: ${budget || 'N/A'}
        
        Message:
        ${message}
      `,
      html: `
        <h3>New Contact Form Submission - NORTRADE</h3>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; border-color: #eee;">
          <tr><td><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Company</strong></td><td>${company || 'N/A'}</td></tr>
          <tr><td><strong>Service Requested</strong></td><td>${service || 'N/A'}</td></tr>
          <tr><td><strong>Budget</strong></td><td>${budget || 'N/A'}</td></tr>
        </table>
        <br/>
        <h4>Message:</h4>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // 2. Confirmation copy email to the client
    const clientMailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `NORTRADE | Inquiry Confirmation`,
      text: `
        Dear ${name},

        Thank you for contacting NORTRADE. We have received your inquiry and our team will get back to you within 24 hours.

        Here is a copy of your query:
        ---------------------------------------------
        Name: ${name}
        Email: ${email}
        Company: ${company || 'N/A'}
        
        Message:
        ${message}
        ---------------------------------------------

        Best regards,
        The NORTRADE Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 8px;">
          <h2 style="color: #1A1A1A; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Thank you for your inquiry</h2>
          <p>Dear ${name},</p>
          <p>Thank you for contacting <strong>NORTRADE</strong>. We have received your request and will get back to you within 24 hours.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="color: #555; margin-bottom: 10px;">Summary of your request:</h3>
          <table cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f9f9f9;"><td style="width: 120px; font-weight: bold; border: 1px solid #eee;">Name</td><td style="border: 1px solid #eee;">${name}</td></tr>
            <tr><td style="font-weight: bold; border: 1px solid #eee;">Email</td><td style="border: 1px solid #eee;">${email}</td></tr>
            <tr style="background: #f9f9f9;"><td style="font-weight: bold; border: 1px solid #eee;">Company</td><td style="border: 1px solid #eee;">${company || 'N/A'}</td></tr>
          </table>
          <br/>
          <strong>Message:</strong>
          <blockquote style="margin: 10px 0; padding: 12px 15px; background: #f9f9f9; border-left: 4px solid #1A1A1A; color: #555; font-style: italic;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.85rem; color: #777; margin-bottom: 0;">&copy; NORTRADE. All Rights Reserved.</p>
        </div>
      `
    };

    // Send both emails in parallel
    const [adminInfo, clientInfo] = await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(clientMailOptions)
    ]);

    console.log('Admin notification sent: %s', adminInfo.messageId);
    console.log('Client confirmation sent: %s', clientInfo.messageId);

    res.status(200).json({ success: true, message: 'Emails sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`NORTRADE Server running on http://localhost:${PORT}`);
});
