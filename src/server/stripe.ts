import { Router } from 'express';
import Stripe from 'stripe';
import { pool } from './db.js';
import { authenticateToken } from './auth.js';

export const stripeRouter = Router();

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }
  return stripeClient;
}

stripeRouter.post('/create-checkout-session', authenticateToken, async (req: any, res) => {
  try {
    const stripe = getStripe();
    const userId = req.user.id;
    
    // Get user from DB
    const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id.toString() }
      });
      customerId = customer.id;
      await pool.query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, user.id]);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || 'price_placeholder', // Replace with actual price ID in .env
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Webhook endpoint
stripeRouter.post('/webhook', async (req: any, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return res.status(400).send('Webhook secret missing');
  }

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          
          await pool.query('UPDATE users SET subscription_status = ?, subscription_id = ? WHERE stripe_customer_id = ?', ['active', subscriptionId, customerId]);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status; // 'active', 'past_due', 'canceled', etc.
        
        await pool.query('UPDATE users SET subscription_status = ? WHERE stripe_customer_id = ?', [status, customerId]);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        await pool.query('UPDATE users SET subscription_status = ? WHERE stripe_customer_id = ?', ['canceled', customerId]);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Internal Server Error');
  }
});
