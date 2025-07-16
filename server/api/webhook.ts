import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event) // Use raw body for verification
  const headers = event.headers
  const yocoSignature = headers['yoco-signature'] // Adjust header based on Yoco's docs

  const secret = process.env.YOCO_WEBHOOK_SECRET // from your .env

  // Compute signature (verify hashing method from docs, usually sha256)
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (computedSignature !== yocoSignature) {
    console.warn("❌ Webhook signature mismatch")
    event.node.res.statusCode = 401
    return { error: "Invalid signature" }
  }

  const parsedBody = JSON.parse(body)
  console.log("📡 Received valid Yoco webhook:", parsedBody)

  if (parsedBody.type === 'payment.succeeded') {
    console.log("✅ Payment succeeded:", parsedBody)
    // TODO: update Supabase here
  } else {
    console.log("ℹ️ Ignored event type:", parsedBody.type)
  }

  return { received: true }
})
