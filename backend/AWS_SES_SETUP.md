# AWS SES Setup Guide

## Prerequisites

- AWS Account
- Domain (for verified identities)
- AWS IAM user with SES permissions

---

## Step 1: Verify Your Domain

1. Go to [AWS Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Email Addressing** → **Verified identities**
3. Click **Create identity**
4. Select **Domain** and enter your domain (e.g., `yourdomain.com`)
5. Click **Create identity**
6. Copy the DNS records provided by AWS
7. Add these DNS records to your domain provider (GoDaddy, Route 53, Cloudflare, etc.)
8. Wait for verification (can take up to 72 hours, usually faster)

---

## Step 2: Create IAM User (Recommended)

Instead of using root credentials, create an IAM user with SES permissions:

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new user (e.g., `ses-sender`)
3. Attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSES",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

4. Save the Access Key ID and Secret Access Key

---

## Step 3: Move SES to Production (Sandbox Removal)

By default, SES is in **Sandbox** mode with limitations:
- Can only send to verified email addresses
- Daily sending limit: 200 emails

### Request Production Access:

1. Go to [SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Account Dashboard**
3. Click **Request production access**
4. Fill in:
   - **Website URL**: Your website
   - **Use case description**: Explain how you use email
   - **Email types**: Transactional emails
   - **Preview/Approve**: Confirm details
5. Submit and wait for approval (usually 24-48 hours)

---

## Step 4: Environment Variables

Add these to your `.env` file:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your-secret-key

# SES Configuration
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=Your Brand Name
```

---

## Step 5: Test SES

You can test using AWS CLI:

```bash
aws ses send-email \
  --to recipient@example.com \
  --subject "Test Email" \
  --body "This is a test email from AWS SES" \
  --from noreply@yourdomain.com \
  --region us-east-1
```

---

## Service Usage

Import and use the email service:

```typescript
import { emailService } from "./services/email.js";

// Send custom email
await emailService.send({
  to: "user@example.com",
  subject: "Hello",
  body: "Your message here",
  isHtml: true  // for HTML emails
});

// Pre-built templates
await emailService.sendOTPEmail("user@example.com", "1234");
await emailService.sendWelcomeEmail("user@example.com", "John");
await emailService.sendOrderConfirmation("user@example.com", "ORD-123", "Order details");
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sending | Check if domain is verified |
| "Mail from domain not verified" | Complete domain verification |
| Sandbox mode | Request production access |
| Sending limit reached | Request limit increase |
| Invalid credentials | Verify IAM access keys |

---

## Cost

- **Sandbox**: Free tier available
- **Production**: $0.10 per 1,000 emails (varies by region)
- First 62,000 emails/month free in first year (AWS Free Tier)