import env from '@/utils/env'
import 'server-only'

import Stripe from 'stripe'

export const stripe = new Stripe(env.BOKUN_ENVIRONMENT == 'DEV' ? env.STRIPE_SECRET_KEY : env.STRIPE_PROD_SECRET);