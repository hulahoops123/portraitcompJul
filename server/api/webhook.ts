import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  // 1. Get raw body
  const body = await readRawBody(event)
  if (!body) {
    console.warn("❌ Empty webhook body")
    return { error: "Invalid request" }
  }

  // 2. Extract Svix-style headers (Yoco uses these!)
  const headers = event.node.req.headers
  const webhookId = headers['webhook-id']
  const webhookTimestamp = headers['webhook-timestamp']
  const webhookSignature = headers['webhook-signature']

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.warn("❌ Missing Svix headers (Yoco webhook)")
    return { error: "Unauthorized" }
  }

  // 3. Get secret (from .env, same as in Yoco dashboard)
  const secret = process.env.YOCO_WEBHOOK_SECRET // e.g., 'whsec_...'
  if (!secret) {
    console.error("❌ Missing webhook secret")
    return { error: "Server error" }
  }

  // 4. Reconstruct signed content (Yoco/Svix format)
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`

  // 5. Compute expected signature (decode secret first)
  const secretBytes = Buffer.from(secret.split('_')[1], 'base64') // Extract after 'whsec_'
  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  // 6. Compare signatures (Svix format: "v1,{signature}")
  const receivedSignature = webhookSignature.split(',')[1]
  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'base64'),
    Buffer.from(receivedSignature, 'base64')
  )) {
    console.warn("❌ Webhook signature mismatch")
    return { error: "Invalid signature" }
  }

  // 7. If we get here, the webhook is valid!
  try {
    const parsedBody = JSON.parse(body)
    console.log("📡 Valid Yoco webhook:", parsedBody.type)

    if (parsedBody.type === 'payment.succeeded') {
      console.log("✅ Payment succeeded:", parsedBody.id)
      // Handle payment (e.g., update database)
    }
    
    return { received: true } // 200 OK

  } catch (e) {
    console.error("❌ JSON parse error:", e)
    return { error: "Invalid payload" }
  }
})