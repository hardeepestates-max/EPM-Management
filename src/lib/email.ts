import { Resend } from 'resend'

// Lazy initialization to prevent build errors when API key is not set
let resend: Resend | null = null

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

interface TenantInviteEmailProps {
  to: string
  tenantName?: string
  propertyName: string
  propertyAddress: string
  unitNumber: string
  rentAmount: number
  inviteLink: string
}

export async function sendTenantInviteEmail({
  to,
  tenantName,
  propertyName,
  propertyAddress,
  unitNumber,
  rentAmount,
  inviteLink
}: TenantInviteEmailProps) {
  const greeting = tenantName ? `Hi ${tenantName},` : 'Hi,'

  const { data, error } = await getResend().emails.send({
    from: 'Elevate Property Management <noreply@elevateproperty.management>',
    to: [to],
    subject: `You're Invited to Join Elevate Property Management`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Elevate Property Management</h1>
          </div>

          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">${greeting}</p>

            <p style="margin: 0 0 20px 0; font-size: 16px;">
              You've been invited to set up your tenant portal for your new home at:
            </p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a; font-size: 18px;">${propertyName}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;">${propertyAddress}</p>
              <p style="margin: 0; color: #64748b;">
                <strong>Unit:</strong> ${unitNumber} &nbsp;|&nbsp;
                <strong>Rent:</strong> $${rentAmount.toLocaleString()}/month
              </p>
            </div>

            <p style="margin: 0 0 25px 0; font-size: 16px;">
              Click the button below to create your account and access your tenant portal:
            </p>

            <div style="text-align: center;">
              <a href="${inviteLink}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Create Your Account
              </a>
            </div>
          </div>

          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
            This invite link will expire in 7 days. If you have any questions, please contact your property manager.
          </p>

          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            If you didn't expect this email, you can safely ignore it.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            Elevate Property Management<br>
            North Jersey Property Management Services<br>
            <a href="https://elevateproperty.management" style="color: #2563eb;">elevateproperty.management</a>
          </p>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error('Error sending email:', error)
    throw error
  }

  return data
}
