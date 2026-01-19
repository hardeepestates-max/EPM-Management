import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
})

export const CARD_FEE_PERCENT = parseFloat(process.env.CARD_CONVENIENCE_FEE_PERCENT || "2.9")
export const ACH_FEE_AMOUNT = parseFloat(process.env.ACH_FEE_AMOUNT || "0") // Free ACH

export function calculateCardFee(amount: number): number {
  return Math.round((amount * CARD_FEE_PERCENT / 100) * 100) / 100
}

export function calculateTotalWithCardFee(amount: number): number {
  return amount + calculateCardFee(amount)
}
