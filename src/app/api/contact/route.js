import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const { name, email, subject, phone, message } = body;

    // ---------------------------
    // Validation
    // ---------------------------

    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !phone?.trim() ||
      !message?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    // ---------------------------
    // SMTP environment validation
    // ---------------------------

    const requiredEnv = [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
    ];

    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.error("Missing SMTP environment variables:", missing);

      return NextResponse.json(
        {
          success: false,
          message: "Email service is not configured correctly.",
        },
        { status: 500 },
      );
    }

    // ---------------------------
    // SMTP transporter
    // ---------------------------

    const port = Number(process.env.SMTP_PORT);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,

      // Gmail:
      // port 465 => true
      // port 587 => false
      secure: port === 465,

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // ---------------------------
    // Email
    // ---------------------------

    const data = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    };

    const mailOptions = {
      // IMPORTANT:
      // Do not use customer's email here.
      // Gmail may reject/spam it.
      from: `"Aurora Spare Parts Website" <${process.env.SMTP_USER}>`,

      // Aurora receives contact requests
      to: process.env.CONTACT_RECEIVER_EMAIL || "auroraspareparts@gmail.com",

      // When Aurora clicks Reply,
      // it replies directly to the customer.
      replyTo: data.email,

      subject: `Website Inquiry: ${data.subject}`,

      text: buildEmailText(data),
      html: buildEmailHtml(data),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("SMTP email sent successfully", {
      messageId: info.messageId,
      response: info.response,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Contact SMTP error:", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
    });

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error?.message || "Unable to send the message."
            : "Unable to send the message. Please try again.",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Email template (black & white)                                            */
/* -------------------------------------------------------------------------- */

const COMPANY = {
  name: "Aurora Spare Parts",
  logo: "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/logos/Aurora.png",
};

const BRAND = {
  black: "#000000",
  ink: "#111111",
  body: "#262626",
  muted: "#6b6b6b",
  subtle: "#8f8f8f",
  border: "#e4e4e4",
  borderStrong: "#d0d0d0",
  page: "#f2f2f2",
  card: "#ffffff",
  panel: "#fafafa",
  white: "#ffffff",
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function buildEmailText({ name, email, phone, subject, message }) {
  const line = "------------------------------------------------";

  return `
NEW WEBSITE INQUIRY
${COMPANY.name}

${line}

CUSTOMER

${name}
Email: ${email}
Phone: ${phone}

SUBJECT

${subject}

MESSAGE

${message}

${line}

Reply directly to this email to respond to ${name}.

Received: ${formatDate()}
  `.trim();
}

function buildEmailHtml({ name, email, phone, subject, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);
  const initials = escapeHtml(getInitials(name));
  const received = escapeHtml(formatDate());
  const year = new Date().getFullYear();

  // Pre-filled reply link: opens the staff member's mail app ready to respond.
  const replyHref = escapeHtml(
    `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`,
  );

  // Phone link: keep digits and leading "+" only.
  const telHref = escapeHtml(`tel:${phone.replace(/[^\d+]/g, "")}`);

  // Preview text shown next to the subject in the inbox list.
  const preheader = escapeHtml(
    `${name}: ${String(message).replace(/\s+/g, " ").slice(0, 110)}`,
  );

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>New Website Inquiry</title>
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
      a { text-decoration: none; }

      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
        .outer-pad { padding: 0 !important; }
        .px { padding-left: 22px !important; padding-right: 22px !important; }
        .stack { display: block !important; width: 100% !important; text-align: left !important; }
        .stack-gap { padding-top: 6px !important; }
        .btn-full { display: block !important; width: 100% !important; box-sizing: border-box !important; }
        .title { font-size: 22px !important; }
      }
    </style>
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <![endif]-->
  </head>

  <body
    style="margin:0; padding:0; width:100%; background-color:${BRAND.page}; font-family:${FONT_STACK}; color:${BRAND.body};"
  >
    <!-- Preheader (hidden inbox preview text) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:${BRAND.page};">
      ${preheader}
      &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.page};">
      <tr>
        <td align="center" class="outer-pad" style="padding:36px 16px;">

          <table
            role="presentation"
            class="container"
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="width:600px; max-width:600px; background-color:${BRAND.card}; border:1px solid ${BRAND.border}; border-radius:14px; overflow:hidden;"
          >

            <!-- Top accent bar -->
            <tr>
              <td height="6" bgcolor="${BRAND.black}" style="height:6px; line-height:6px; font-size:0; background-color:${BRAND.black};">&nbsp;</td>
            </tr>

            <!-- Header: logo + company -->
            <tr>
              <td class="px" bgcolor="${BRAND.white}" style="background-color:${BRAND.white}; padding:28px 36px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="stack" valign="middle">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td valign="middle" style="padding-right:14px;">
                            <img
                              src="${COMPANY.logo}"
                              alt="${COMPANY.name}"
                              height="44"
                              style="display:block; height:44px; width:auto; max-width:160px;"
                            />
                          </td>
                          <td valign="middle">
                            <div style="font-size:16px; font-weight:800; letter-spacing:0.4px; color:${BRAND.black}; line-height:1.2;">
                              ${COMPANY.name}
                            </div>
                            <div style="margin-top:3px; font-size:11px; font-weight:600; letter-spacing:1.6px; text-transform:uppercase; color:${BRAND.subtle};">
                              Website Contact Form
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td class="stack stack-gap" align="right" valign="middle" style="font-size:12px; line-height:1.5; color:${BRAND.muted};">
                      ${received}
                    </td>
                  </tr>
                </table>
              </td>
            </tr> 

            <!-- Sender card -->
            <tr>
              <td class="px" style="padding:30px 36px 0;">
                <div style="font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:${BRAND.muted};">
                  From
                </div>

                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin-top:10px; background-color:${BRAND.panel}; border:1px solid ${BRAND.border}; border-radius:12px;"
                >
                  <tr>
                    <td style="padding:20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <!-- Avatar -->
                          <td width="60" valign="top" style="width:60px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td
                                  align="center"
                                  valign="middle"
                                  width="48"
                                  height="48"
                                  bgcolor="${BRAND.black}"
                                  style="width:48px; height:48px; background-color:${BRAND.black}; border-radius:24px; font-size:16px; font-weight:700; color:${BRAND.white}; line-height:48px; letter-spacing:0.5px;"
                                >
                                  ${initials}
                                </td>
                              </tr>
                            </table>
                          </td>

                          <!-- Name + contact -->
                          <td valign="middle">
                            <div style="font-size:17px; font-weight:700; line-height:1.3; color:${BRAND.black};">
                              ${safeName}
                            </div>
                            <div style="margin-top:4px; font-size:14px; line-height:1.4;">
                              <a href="mailto:${safeEmail}" style="color:${BRAND.body}; text-decoration:underline; word-break:break-all;">
                                ${safeEmail}
                              </a>
                            </div>
                            <div style="margin-top:3px; font-size:14px; line-height:1.4;">
                              <a href="${telHref}" style="color:${BRAND.body}; text-decoration:underline; word-break:break-all;">
                                ${safePhone}
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Subject -->
            <tr>
              <td class="px" style="padding:28px 36px 0;">
                <div style="font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:${BRAND.muted};">
                  Subject
                </div>
                <div style="margin-top:8px; font-size:19px; font-weight:700; line-height:1.4; color:${BRAND.black}; word-break:break-word;">
                  ${safeSubject}
                </div>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td class="px" style="padding:24px 36px 0;">
                <div style="height:1px; line-height:1px; font-size:0; background-color:${BRAND.border};">&nbsp;</div>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td class="px" style="padding:24px 36px 0;">
                <div style="font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:${BRAND.muted};">
                  Message
                </div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
                  <tr>
                    <td
                      bgcolor="${BRAND.panel}"
                      style="background-color:${BRAND.panel};   solid ${BRAND.border};   solid ${BRAND.black}; border-radius:4px 10px 10px 4px; padding:20px 22px; font-size:15px; line-height:1.75; color:${BRAND.body}; white-space:pre-wrap; word-break:break-word;"
                    >${safeMessage}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Call to action -->
            <tr>
              <td class="px" style="padding:30px 36px 34px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td class="stack" valign="middle">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${replyHref}" style="height:48px; v-text-anchor:middle; width:220px;" arcsize="20%" stroke="f" fillcolor="${BRAND.black}">
                        <w:anchorlock/>
                        <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:15px; font-weight:bold;">Reply to ${safeName}</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a
                        href="${replyHref}"
                        class="btn-full"
                        style="display:inline-block; background-color:${BRAND.black}; color:${BRAND.white}; font-size:15px; font-weight:700; line-height:48px; text-align:center; padding:0 30px; border-radius:10px; mso-hide:all;"
                      >
                        Reply to ${safeName} &rarr;
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                class="px"
                bgcolor="${BRAND.panel}"
                style="background-color:${BRAND.panel}; padding:24px 36px 28px; border-top:1px solid ${BRAND.border}; text-align:center;"
              >
                <div style="font-size:13px; font-weight:700; color:${BRAND.black}; letter-spacing:0.3px;">
                  ${COMPANY.name}
                </div>
                <div style="margin-top:8px; font-size:12px; line-height:1.7; color:${BRAND.subtle};">
                  Sent automatically from the ${COMPANY.name} website contact form.<br />
                  Please do not forward this email outside the organisation, it contains a customer&rsquo;s personal details.
                </div>
                <div style="margin-top:10px; font-size:11px; color:${BRAND.subtle};">
                  &copy; ${year} ${COMPANY.name}. All rights reserved.
                </div>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatDate(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Dar_es_Salaam",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
