require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware with 50MB payload limits for file attachments
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '.')));

// Label maps for bilingual email formatting
const projectTypeLabels = {
  promotion: { fr: 'Promotion Immobilière', en: 'Property Development' },
  architecture: { fr: 'Architecture', en: 'Architecture' },
  renovation: { fr: 'Rénovation', en: 'Renovation' },
  existing: { fr: 'Bien Existant', en: 'Existing Property' },
  staging: { fr: 'Home Staging', en: 'Home Staging' },
  hospitality: { fr: 'Hôtellerie & Restauration', en: 'Hospitality' },
  other: { fr: 'Autre', en: 'Other' }
};

const requestedServiceLabels = {
  interior: { fr: 'Rendus Intérieurs', en: 'Interior Renderings' },
  exterior: { fr: 'Rendus Extérieurs', en: 'Exterior Renderings' },
  staging: { fr: 'Home Staging Virtuel', en: 'Virtual Home Staging' },
  animation: { fr: 'Animation Architecturale', en: 'Architectural Animation' },
  tour: { fr: 'Visite Virtuelle', en: 'Virtual Tour' },
  plans: { fr: 'Plans 3D', en: '3D Floor Plans' },
  consulting: { fr: 'Conseil en Visualisation', en: 'Visualisation Consulting' },
  multiple: { fr: 'Services Multiples', en: 'Multiple Services' },
  unsure: { fr: 'Pas Encore Sûr', en: 'Not Sure Yet' }
};

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
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
    const {
      prenom = '',
      nom = '',
      name = '',
      email = '',
      company = '',
      projectType = '',
      project_type = '',
      requestedService = '',
      requested_service = '',
      message = '',
      fileData = null,
      lang = 'fr'
    } = req.body;

    const isFr = lang === 'fr';
    const finalFirstName = prenom || name.split(' ')[0] || '';
    const finalLastName = nom || name.split(' ').slice(1).join(' ') || '';
    const fullName = `${finalFirstName} ${finalLastName}`.trim() || name || 'Client';

    if (!email || !message) {
      return res.status(400).json({
        error: isFr ? 'L’adresse e-mail et les détails du projet sont requis.' : 'Email and project details are required.'
      });
    }

    const rawProjectType = projectType || project_type;
    const rawService = requestedService || requested_service;

    const pTypeObj = projectTypeLabels[rawProjectType] || {};
    const serviceObj = requestedServiceLabels[rawService] || {};

    const pTypeLabel = isFr ? (pTypeObj.fr || rawProjectType || 'Non spécifié') : (pTypeObj.en || rawProjectType || 'Not specified');
    const serviceLabel = isFr ? (serviceObj.fr || rawService || 'Non spécifié') : (serviceObj.en || rawService || 'Not specified');

    // Build email attachments if fileData is attached
    const mailAttachments = [];
    let fileSummaryText = 'Aucun fichier joint / None';
    let fileSummaryHtml = '<i>Aucun fichier / None</i>';

    if (fileData && fileData.base64) {
      const fileBuffer = Buffer.from(fileData.base64, 'base64');
      const sizeMB = (fileData.size ? (fileData.size / (1024 * 1024)).toFixed(2) : '0');
      mailAttachments.push({
        filename: fileData.filename || 'attachment',
        content: fileBuffer,
        contentType: fileData.contentType || 'application/octet-stream'
      });
      fileSummaryText = `${fileData.filename || 'attachment'} (${sizeMB} MB)`;
      fileSummaryHtml = `<strong>${fileData.filename || 'attachment'}</strong> (${sizeMB} MB)`;
    }

    // 1. Executive Admin Notification Email
    const adminMailOptions = {
      from: process.env.FROM_EMAIL || 'contact@nortrade.ch',
      to: process.env.RECIPIENT_EMAIL || 'contact@nortrade.ch',
      subject: `Nouveau Lead: ${fullName} — ${pTypeLabel}`,
      attachments: mailAttachments,
      text: `
        Nouvelle demande reçue depuis le site NORTRADE :

        - Prénom : ${finalFirstName}
        - Nom de famille : ${finalLastName}
        - E-mail : ${email}
        - Entreprise : ${company || 'N/A'}
        - Type de Projet : ${pTypeLabel}
        - Service Souhaité : ${serviceLabel}
        - Fichier Joint : ${fileSummaryText}

        Détails du projet :
        ${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #111111; color: #ffffff; padding: 24px 30px; text-align: left;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.05em;">N O R T R A D E</h2>
            <p style="margin: 4px 0 0; font-size: 12px; color: #aaaaaa; text-transform: uppercase; letter-spacing: 0.1em;">Nouvelle Demande Client</p>
          </div>
          <div style="padding: 30px;">
            <table cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="background: #f9f9fb;"><td style="width: 170px; font-weight: 600; border-bottom: 1px solid #eeeeee;">Prénom / First Name</td><td style="border-bottom: 1px solid #eeeeee;">${finalFirstName}</td></tr>
              <tr><td style="font-weight: 600; border-bottom: 1px solid #eeeeee;">Nom / Last Name</td><td style="border-bottom: 1px solid #eeeeee;">${finalLastName}</td></tr>
              <tr style="background: #f9f9fb;"><td style="font-weight: 600; border-bottom: 1px solid #eeeeee;">Adresse Email</td><td style="border-bottom: 1px solid #eeeeee;"><a href="mailto:${email}" style="color: #0066cc;">${email}</a></td></tr>
              <tr><td style="font-weight: 600; border-bottom: 1px solid #eeeeee;">Entreprise / Company</td><td style="border-bottom: 1px solid #eeeeee;">${company || '<i>Non renseigné / N/A</i>'}</td></tr>
              <tr style="background: #f9f9fb;"><td style="font-weight: 600; border-bottom: 1px solid #eeeeee;">Type de Projet</td><td style="border-bottom: 1px solid #eeeeee;">${pTypeLabel}</td></tr>
              <tr><td style="font-weight: 600; border-bottom: 1px solid #eeeeee;">Service Souhaité</td><td style="border-bottom: 1px solid #eeeeee;">${serviceLabel}</td></tr>
              <tr style="background: #f9f9fb;"><td style="font-weight: 600; border-bottom: 1px solid #eeeeee;">Fichier Joint / Attachment</td><td style="border-bottom: 1px solid #eeeeee;">${fileSummaryHtml}</td></tr>
            </table>
            <div style="margin-top: 24px;">
              <h4 style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #111;">Détails du projet / Project Details :</h4>
              <div style="padding: 16px; background: #f4f4f6; border-left: 4px solid #111111; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #333333;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
        </div>
      `
    };

    // 2. Automated Confirmation Copy Email to Prospect / Client
    const clientSubject = isFr ? 'NORTRADE | Confirmation de votre demande de projet' : 'NORTRADE | Project Inquiry Confirmation';
    const clientTitle = isFr ? 'Confirmation de votre demande' : 'Confirmation of your inquiry';
    const clientGreeting = isFr ? `Bonjour ${finalFirstName},` : `Dear ${finalFirstName},`;
    const clientMessageBody = isFr
      ? `Nous vous remercions de l’intérêt que vous portez à <strong>NORTRADE</strong>. Nous avons bien reçu vos éléments d’information concernant votre projet.`
      : `Thank you for your interest in <strong>NORTRADE</strong>. We have received your submission and project details.`;
    const clientNextSteps = isFr
      ? `Notre équipe étudie actuellement votre dossier et reviendra vers vous sous <strong>24 heures</strong> afin de vous proposer une approche visuelle sur mesure.`
      : `Our executive team is reviewing your project requirements and will get back to you within <strong>24 hours</strong> to discuss a tailored approach.`;

    const clientMailOptions = {
      from: process.env.FROM_EMAIL || 'contact@nortrade.ch',
      to: email,
      subject: clientSubject,
      text: `
        ${clientGreeting}

        ${isFr ? 'Merci d\'avoir contacté NORTRADE. Nous avons bien reçu vos éléments et notre équipe reviendra vers vous sous 24h.' : 'Thank you for contacting NORTRADE. We have received your project details and will get back to you within 24 hours.'}

        Récapitulatif / Summary:
        - ${isFr ? 'Prénom' : 'First Name'}: ${finalFirstName}
        - ${isFr ? 'Nom' : 'Last Name'}: ${finalLastName}
        - ${isFr ? 'Email' : 'Email'}: ${email}
        - ${isFr ? 'Entreprise' : 'Company'}: ${company || 'N/A'}
        - ${isFr ? 'Type de Projet' : 'Project Type'}: ${pTypeLabel}
        - ${isFr ? 'Service Souhaité' : 'Requested Service'}: ${serviceLabel}
        - ${isFr ? 'Fichier Joint' : 'Attached File'}: ${fileSummaryText}

        ${isFr ? 'Détails du projet' : 'Project Details'}:
        ${message}

        Cordialement / Best regards,
        L'équipe NORTRADE | Swiss Real Estate Enhancement Firm
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #222222; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #111111; color: #ffffff; padding: 28px 32px; text-align: left;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.05em;">N O R T R A D E</h2>
            <p style="margin: 6px 0 0; font-size: 11px; color: #aaaaaa; text-transform: uppercase; letter-spacing: 0.12em;">Cabinet Suisse en Valorisation Immobilière</p>
          </div>
          <div style="padding: 32px;">
            <h3 style="margin-top: 0; font-size: 18px; color: #111111; font-weight: 600;">${clientTitle}</h3>
            <p style="font-size: 15px; line-height: 1.6; color: #333333;">${clientGreeting}</p>
            <p style="font-size: 14px; line-height: 1.65; color: #444444;">${clientMessageBody}</p>
            <p style="font-size: 14px; line-height: 1.65; color: #444444;">${clientNextSteps}</p>
            
            <div style="margin: 28px 0; padding: 20px; background: #f9f9fb; border-radius: 8px; border: 1px solid #eeeeee;">
              <h4 style="margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #777777;">${isFr ? 'Récapitulatif de votre demande' : 'Summary of your submission'}</h4>
              <table cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 13px; color: #333333;">
                <tr><td style="width: 140px; font-weight: 600;">${isFr ? 'Nom complet' : 'Full Name'}</td><td>${fullName}</td></tr>
                <tr><td style="font-weight: 600;">${isFr ? 'Adresse e-mail' : 'Email Address'}</td><td>${email}</td></tr>
                <tr><td style="font-weight: 600;">${isFr ? 'Entreprise' : 'Company'}</td><td>${company || '<i>N/A</i>'}</td></tr>
                <tr><td style="font-weight: 600;">${isFr ? 'Type de Projet' : 'Project Type'}</td><td>${pTypeLabel}</td></tr>
                <tr><td style="font-weight: 600;">${isFr ? 'Service Souhaité' : 'Requested Service'}</td><td>${serviceLabel}</td></tr>
                <tr><td style="font-weight: 600;">${isFr ? 'Fichier Joint' : 'Attached File'}</td><td>${fileSummaryHtml}</td></tr>
              </table>
              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 13px; line-height: 1.5; color: #555555;">
                <strong>${isFr ? 'Détails' : 'Details'} :</strong> ${message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #333333; margin-bottom: 4px;">${isFr ? 'Cordialement,' : 'Best regards,'}</p>
            <p style="font-size: 14px; font-weight: 600; color: #111111; margin-top: 0;">L’équipe NORTRADE</p>

            <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #eeeeee; font-size: 12px; color: #888888; line-height: 1.5;">
              <p style="margin: 0;">NORTRADE — Genève, Suisse | <a href="mailto:contact@nortrade.ch" style="color: #666666; text-decoration: underline;">contact@nortrade.ch</a> | +41 78 206 59 42</p>
              <p style="margin: 4px 0 0;">&copy; NORTRADE. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      `
    };

    // Send both Admin Notification and Client Confirmation email in parallel
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
