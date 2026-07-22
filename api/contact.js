const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, company, service, budget, message, lang } = req.body;
    const isFr = lang === 'fr';

    if (!name || !email || !message) {
      return res.status(400).json({ error: isFr ? 'Les champs nom, e-mail et message sont requis.' : 'Name, email, and message are required fields.' });
    }

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

    // 1. Email notification to administrator
    const adminMailOptions = {
      from: process.env.FROM_EMAIL,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Lead: ${name} - General Inquiry`,
      text: `
        You have received a new contact form submission from NORTRADE website:
        
        Name: ${name}
        Email: ${email}
        Company: ${company || 'N/A'}
        Language: ${lang || 'fr'}
        
        Message:
        ${message}
      `,
      html: `
        <h3>New Contact Form Submission - NORTRADE</h3>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; border-color: #eee;">
          <tr><td><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Company</strong></td><td>${company || 'N/A'}</td></tr>
          <tr><td><strong>Language</strong></td><td>${lang || 'fr'}</td></tr>
        </table>
        <br/>
        <h4>Message:</h4>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // 2. Confirmation copy email to the client (Bilingual)
    const clientSubject = isFr ? 'NORTRADE | Confirmation de votre demande' : 'NORTRADE | Inquiry Confirmation';
    const clientTitle = isFr ? 'Merci pour votre demande' : 'Thank you for your inquiry';
    const clientGreeting = isFr ? `Bonjour ${name},` : `Dear ${name},`;
    const clientBody = isFr 
      ? `Merci d'avoir contacté <strong>NORTRADE</strong>. Nous avons bien reçu votre demande et notre équipe vous répondra dans un délai de 24 heures.`
      : `Thank you for contacting <strong>NORTRADE</strong>. We have received your request and our team will get back to you within 24 hours.`;
    const clientSummaryHead = isFr ? 'Récapitulatif de votre demande :' : 'Summary of your request:';
    const labelName = isFr ? 'Nom' : 'Name';
    const labelEmail = isFr ? 'E-mail' : 'Email';
    const labelCompany = isFr ? 'Entreprise' : 'Company';
    const labelMessage = isFr ? 'Message :' : 'Message:';
    const clientSignoff = isFr ? 'Cordialement,<br>L\'équipe NORTRADE' : 'Best regards,<br>The NORTRADE Team';
    const clientCopyright = isFr ? '&copy; NORTRADE. Tous droits réservés.' : '&copy; NORTRADE. All Rights Reserved.';

    const clientMailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: clientSubject,
      text: `
        ${clientGreeting}

        ${isFr ? 'Merci d\'avoir contacté NORTRADE. Nous avons bien reçu votre demande et notre équipe vous répondra dans un délai de 24h.' : 'Thank you for contacting NORTRADE. We have received your inquiry and our team will get back to you within 24 hours.'}

        ${clientSummaryHead}
        ---------------------------------------------
        ${labelName}: ${name}
        ${labelEmail}: ${email}
        ${labelCompany}: ${company || 'N/A'}
        
        ${labelMessage}
        ${message}
        ---------------------------------------------

        ${isFr ? 'Cordialement,\nL\'équipe NORTRADE' : 'Best regards,\nThe NORTRADE Team'}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 8px;">
          <h2 style="color: #1A1A1A; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">${clientTitle}</h2>
          <p>${clientGreeting}</p>
          <p>${clientBody}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="color: #555; margin-bottom: 10px;">${clientSummaryHead}</h3>
          <table cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f9f9f9;"><td style="width: 120px; font-weight: bold; border: 1px solid #eee;">${labelName}</td><td style="border: 1px solid #eee;">${name}</td></tr>
            <tr><td style="font-weight: bold; border: 1px solid #eee;">${labelEmail}</td><td style="border: 1px solid #eee;">${email}</td></tr>
            <tr style="background: #f9f9f9;"><td style="font-weight: bold; border: 1px solid #eee;">${labelCompany}</td><td style="border: 1px solid #eee;">${company || 'N/A'}</td></tr>
          </table>
          <br/>
          <strong>${labelMessage}</strong>
          <blockquote style="margin: 10px 0; padding: 12px 15px; background: #f9f9f9; border-left: 4px solid #1A1A1A; color: #555; font-style: italic;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="margin-bottom: 15px;">${clientSignoff}</p>
          <p style="font-size: 0.85rem; color: #777; margin-bottom: 0;">${clientCopyright}</p>
        </div>
      `
    };

    // Send both emails in parallel
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(clientMailOptions)
    ]);

    res.status(200).json({ success: true, message: 'Emails sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
}
