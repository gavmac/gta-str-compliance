import sgMail from '@sendgrid/mail'
import { Notification } from './types'

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

// Handle SSL certificate issues in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

interface User {
  id: string
  email: string
  name?: string
}

export async function sendNotificationEmail(notification: Notification, user: User): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured')
    return false
  }

  try {
    const emailContent = generateEmailContent(notification)
    
    const msg = {
      to: user.email,
      from: process.env.FROM_EMAIL || 'notifications@gtacompliance.com',
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    }

    await sgMail.send(msg)
    console.log(`Email sent to ${user.email} for notification ${notification.id}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    
    // In development, log more details but don't fail
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Email would have been sent in production')
      return true
    }
    
    return false
  }
}

function generateEmailContent(notification: Notification) {
  const baseSubject = `GTA Compliance Alert: ${notification.title}`
  
  const templates = {
    mat_due: {
      subject: `MAT Report Due - ${notification.municipality}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">MAT Report Due</h2>
          <p><strong>Municipality:</strong> ${notification.municipality}</p>
          <p><strong>Due Date:</strong> ${notification.due_date ? new Date(notification.due_date).toLocaleDateString() : 'See details'}</p>
          <p>${notification.message}</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Action Required:</strong> File your MAT report to avoid penalties.</p>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/properties" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Properties</a></p>
        </div>
      `,
      text: `MAT Report Due - ${notification.municipality}\n\n${notification.message}\n\nAction Required: File your MAT report to avoid penalties.\n\nView your properties: ${process.env.NEXT_PUBLIC_APP_URL}/properties`
    },
    
    license_expiry: {
      subject: `STR License Expiring - ${notification.municipality}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">License Expiry Alert</h2>
          <p><strong>Municipality:</strong> ${notification.municipality}</p>
          <p><strong>Expiry Date:</strong> ${notification.due_date ? new Date(notification.due_date).toLocaleDateString() : 'See details'}</p>
          <p>${notification.message}</p>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #9a3412;"><strong>Action Required:</strong> Renew your license immediately to continue operating legally.</p>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/properties" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Manage Licenses</a></p>
        </div>
      `,
      text: `STR License Expiring - ${notification.municipality}\n\n${notification.message}\n\nAction Required: Renew your license immediately to continue operating legally.\n\nManage licenses: ${process.env.NEXT_PUBLIC_APP_URL}/properties`
    },
    
    bylaw_update: {
      subject: `By-law Update - ${notification.municipality}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Regulatory Update</h2>
          <p><strong>Municipality:</strong> ${notification.municipality}</p>
          <h3>${notification.title.replace(`${notification.municipality} By-law Update: `, '')}</h3>
          <p>${notification.message}</p>
          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #0c4a6e;"><strong>Review Required:</strong> Check if this update affects your properties.</p>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/properties" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Compliance</a></p>
        </div>
      `,
      text: `By-law Update - ${notification.municipality}\n\n${notification.title}\n\n${notification.message}\n\nReview Required: Check if this update affects your properties.\n\nReview compliance: ${process.env.NEXT_PUBLIC_APP_URL}/properties`
    }
  }

  const template = templates[notification.type as keyof typeof templates]
  
  if (template) {
    return template
  }

  // Fallback template
  return {
    subject: baseSubject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/properties" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a></p>
      </div>
    `,
    text: `${notification.title}\n\n${notification.message}\n\nView dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/properties`
  }
}