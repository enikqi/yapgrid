import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invalid Link - YapGrid</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .card {
                background: white;
                border-radius: 12px;
                padding: 40px;
                max-width: 500px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 { color: #dc2626; margin: 0 0 10px; }
              p { color: #666; line-height: 1.6; }
              .button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #ea580c;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
              }
              .button:hover {
                background: #c2410c;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">❌</div>
              <h1>Invalid Verification Link</h1>
              <p>The verification link is invalid or expired. Please request a new verification email.</p>
              <a href="/settings" class="button">Go to Settings</a>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Verify token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token
        }
      }
    })

    if (!verificationToken) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invalid Token - YapGrid</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .card {
                background: white;
                border-radius: 12px;
                padding: 40px;
                max-width: 500px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 { color: #dc2626; margin: 0 0 10px; }
              p { color: #666; line-height: 1.6; }
              .button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #ea580c;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
              }
              .button:hover {
                background: #c2410c;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">⏰</div>
              <h1>Token Expired</h1>
              <p>This verification link has expired. Please request a new verification email from your settings.</p>
              <a href="/settings" class="button">Go to Settings</a>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: token
          }
        }
      })

      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Token Expired - YapGrid</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .card {
                background: white;
                border-radius: 12px;
                padding: 40px;
                max-width: 500px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 { color: #dc2626; margin: 0 0 10px; }
              p { color: #666; line-height: 1.6; }
              .button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #ea580c;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
              }
              .button:hover {
                background: #c2410c;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">⏰</div>
              <h1>Link Expired</h1>
              <p>This verification link has expired. Please request a new verification email from your settings.</p>
              <a href="/settings" class="button">Go to Settings</a>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Update user's emailVerified field
    await prisma.user.update({
      where: { email: email },
      data: { emailVerified: new Date() }
    })

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token
        }
      }
    })

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified - YapGrid</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 12px;
              padding: 40px;
              max-width: 500px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              animation: slideIn 0.5s ease-out;
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
              animation: bounce 1s ease-in-out;
            }
            @keyframes bounce {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            h1 { color: #10b981; margin: 0 0 10px; }
            p { color: #666; line-height: 1.6; }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background: #ea580c;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              transition: background 0.3s;
            }
            .button:hover {
              background: #c2410c;
            }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              stroke-width: 3;
              stroke: #10b981;
              stroke-miterlimit: 10;
              margin: 10px auto 20px;
              box-shadow: inset 0px 0px 0px #10b981;
              animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
            }
            .checkmark__circle {
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              stroke-width: 2;
              stroke-miterlimit: 10;
              stroke: #10b981;
              fill: none;
              animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
              transform-origin: 50% 50%;
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }
            @keyframes stroke {
              100% {
                stroke-dashoffset: 0;
              }
            }
            @keyframes scale {
              0%, 100% {
                transform: none;
              }
              50% {
                transform: scale3d(1.1, 1.1, 1);
              }
            }
            @keyframes fill {
              100% {
                box-shadow: inset 0px 0px 0px 30px #10b981;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h1>🎉 Email Verified!</h1>
            <p><strong>Congratulations!</strong> Your email has been successfully verified. You now have full access to all features.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">This verification is permanent for your account.</p>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  } catch (error) {
    console.error('Error verifying email:', error)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - YapGrid</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 12px;
              padding: 40px;
              max-width: 500px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 { color: #dc2626; margin: 0 0 10px; }
            p { color: #666; line-height: 1.6; }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background: #ea580c;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            }
            .button:hover {
              background: #c2410c;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Verification Error</h1>
            <p>An error occurred while verifying your email. Please try again or contact support.</p>
            <a href="/settings" class="button">Go to Settings</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

