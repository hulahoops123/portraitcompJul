import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  // Yoco sends their signature in this header
  const signatureHeader = getHeader(event, 'x-yoco-signature')

  if (!signatureHeader) {
    console.log('❌ No signature header found. Rejecting.')
    return { error: 'Missing signature' }
  }

  // Get the raw body exactly as received
  const rawBody = await readRawBody(event)
  const secret = process.env.YOCO_WEBHOOK_SECRET  // store your whsec_... in .env

  // Compute HMAC SHA256
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  if (computedSignature !== signatureHeader) {
    console.log('❌ Invalid signature. Possible spoofed request.')
    return { error: 'Invalid signature' }
  }

  // Now safe to parse JSON
  const body = JSON.parse(rawBody)
  console.log("📡 Verified Yoco webhook:", body)

  if (body.type === 'payment.succeeded') {
    console.log("✅ Payment succeeded:", body)
    // TODO: insert into Supabase stage here
  } else {
    console.log("ℹ️ Ignored event type:", body.type)
  }

  return { received: true }
})
