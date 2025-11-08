# Stripe Integration

This directory contains the complete Stripe integration for the GTA Compliance Digest platform, including payment processing, subscription management, and webhook handling.

## Overview

The Stripe integration handles:
- **Checkout Sessions**: Creating payment sessions for subscription upgrades
- **Subscription Management**: Tracking subscription status and billing cycles
- **Webhook Processing**: Handling Stripe events to keep local data in sync
- **Customer Portal**: Allowing users to manage their billing and subscriptions

## Files Structure

```
lib/stripe/
├── config.ts              # Stripe client configuration and plan definitions
├── webhook-handlers.ts     # Webhook event handlers with error handling
├── webhook-test.ts         # Testing utilities for webhook development
├── webhook-test-runner.ts  # Comprehensive test runner for webhooks
└── README.md              # This documentation
```

## Configuration

### Environment Variables

```bash
# Required for all Stripe functionality
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Required for webhook signature verification
STRIPE_WEBHOOK_SECRET=whsec_...

# Required for webhook database operations
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Stripe Dashboard Setup

1. **Create Products and Prices**:
   - Pro Plan: $29/month (price_pro_monthly)

2. **Configure Webhooks**:
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Enable Customer Portal**:
   - Configure allowed features (cancel subscription, update payment method)
   - Set return URL to your dashboard

## API Endpoints

### POST /api/stripe/checkout
Creates a Stripe checkout session for subscription upgrade.

**Request Body**:
```json
{
  "userId": "user-uuid",
  "plan": "pro"
}
```

**Response**:
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

### GET /api/stripe/checkout?session_id=cs_...
Retrieves checkout session status.

**Response**:
```json
{
  "status": "complete",
  "payment_status": "paid",
  "customer_email": "user@example.com",
  "metadata": {
    "userId": "user-uuid",
    "plan": "pro"
  }
}
```

### POST /api/stripe/portal
Creates a customer portal session for subscription management.

**Request Body**:
```json
{
  "userId": "user-uuid"
}
```

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### POST /api/stripe/webhook
Handles Stripe webhook events (called by Stripe, not your frontend).

## Webhook Events

### checkout.session.completed
Triggered when a user completes payment.

**Actions**:
- Updates user plan to 'paid'
- Creates subscription record with customer and subscription IDs

### customer.subscription.created
Triggered when a subscription is created.

**Actions**:
- Updates subscription record with full details
- Sets billing period dates

### customer.subscription.updated
Triggered when subscription status changes.

**Actions**:
- Updates subscription status
- Downgrades user to 'free' if canceled
- Keeps user on 'paid' if past_due

### customer.subscription.deleted
Triggered when subscription is permanently canceled.

**Actions**:
- Marks subscription as canceled
- Downgrades user to 'free' plan

### invoice.payment_succeeded
Triggered when subscription payment succeeds.

**Actions**:
- Ensures subscription is active
- Ensures user is on paid plan

### invoice.payment_failed
Triggered when subscription payment fails.

**Actions**:
- Marks subscription as past_due
- User remains on paid plan (temporary grace period)

## Error Handling

### Webhook Failures
- **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- **Error Logging**: Comprehensive logging of all webhook events and failures
- **Graceful Degradation**: Failed webhooks don't break the user experience

### Database Errors
- **Transaction Safety**: Each webhook handler is atomic
- **Validation**: All data is validated before database operations
- **Rollback**: Failed operations don't leave partial state

### Stripe API Errors
- **Rate Limiting**: Built-in retry for rate limit errors
- **Network Issues**: Automatic retry for transient network failures
- **Invalid Requests**: Proper error messages and logging

## Testing

### Local Testing

1. **Install Stripe CLI**:
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   ```

2. **Forward Webhooks**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Run Test Suite**:
   ```bash
   npm run test:webhooks
   # or
   node scripts/test-webhooks.js
   ```

### Test Utilities

```typescript
import { testWebhookEvents, sendTestWebhook } from '@/lib/stripe/webhook-test'
import { runAllWebhookTests } from '@/lib/stripe/webhook-test-runner'

// Create test events
const checkoutEvent = testWebhookEvents.checkoutSessionCompleted('user-id', 'customer-id')

// Send to local webhook
await sendTestWebhook(checkoutEvent, 'http://localhost:3000/api/stripe/webhook')

// Run comprehensive tests
await runAllWebhookTests()
```

### Integration Tests

```bash
# Run all webhook integration tests
npm run test tests/integration/stripe-webhooks.test.ts
```

## Monitoring

### Webhook Logs
All webhook events are logged with:
- Event ID and type
- Processing success/failure
- Error messages and stack traces
- Processing duration

### Stripe Dashboard
Monitor webhook delivery in the Stripe Dashboard:
- Delivery attempts and status
- Response codes and timing
- Failed events for manual retry

### Database Monitoring
Track subscription health:
```sql
-- Active subscriptions
SELECT status, COUNT(*) FROM subscriptions GROUP BY status;

-- Recent webhook processing (if you add a webhook_logs table)
SELECT event_type, success, COUNT(*) FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, success;
```

## Security

### Webhook Signature Verification
All webhooks verify Stripe signatures to prevent spoofing:
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

### Database Security
- Uses Supabase service role for webhook operations
- Row Level Security policies protect user data
- All operations are logged for audit trails

### API Security
- User authentication required for checkout/portal endpoints
- Input validation on all parameters
- Rate limiting to prevent abuse

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Check `STRIPE_WEBHOOK_SECRET` environment variable
   - Ensure webhook endpoint URL is correct in Stripe Dashboard
   - Verify webhook is sending to the right environment

2. **User Not Found in Webhook**
   - Check that `userId` is included in checkout session metadata
   - Verify user exists in database before creating checkout session

3. **Subscription Not Created**
   - Check that checkout session includes subscription mode
   - Verify webhook events are being sent by Stripe
   - Check webhook handler logs for errors

4. **Database Permission Errors**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
   - Verify RLS policies allow service role operations
   - Check that all required tables exist

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

This will log all webhook events, database operations, and API calls for debugging.

## Production Deployment

### Checklist

- [ ] Environment variables configured
- [ ] Webhook endpoint URL updated in Stripe Dashboard
- [ ] SSL certificate valid for webhook endpoint
- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] Monitoring and alerting set up
- [ ] Test webhook delivery from Stripe Dashboard

### Monitoring Setup

1. **Webhook Delivery Monitoring**
   - Set up alerts for failed webhook deliveries
   - Monitor webhook response times
   - Track subscription status changes

2. **Database Monitoring**
   - Monitor subscription table for inconsistencies
   - Alert on failed webhook processing
   - Track user plan changes

3. **Error Tracking**
   - Integrate with error tracking service (Sentry, etc.)
   - Monitor API error rates
   - Track payment failures and retries