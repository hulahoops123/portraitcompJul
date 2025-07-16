import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  // 1. Get raw body
  const body = await readRawBody(event)
  if (!body) {
    console.warn("❌ Empty webhook body")
    return { error: "Invalid request" }
  }

  // 2. Handle header (type-safe)
  const yocoSignatureHeader = event.node.req.headers['x-yoco-signature']
  const yocoSignature = Array.isArray(yocoSignatureHeader) 
    ? yocoSignatureHeader[0] // Take first if array
    : yocoSignatureHeader

  if (!yocoSignature || typeof yocoSignature !== 'string') {
    console.warn("❌ Missing or invalid signature header")
    return { error: "Unauthorized" }
  }

  // 3. Verify secret
  const secret = process.env.YOCO_WEBHOOK_SECRET
  if (!secret) {
    console.error("❌ Missing webhook secret")
    return { error: "Server error" }
  }

  // 4. Compute signature
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  // 5. SECURE COMPARISON (fixed)
  try {
    const computedBuffer = Buffer.from(computedSignature, 'hex')
    const yocoBuffer = Buffer.from(yocoSignature, 'hex') // or 'base64' if Yoco uses that
    
    if (!crypto.timingSafeEqual(computedBuffer, yocoBuffer)) {
      console.warn("❌ Webhook signature mismatch")
      return { error: "Invalid signature" }
    }
  } catch (e) {
    console.error("❌ Signature verification failed:", e)
    return { error: "Invalid signature format" }
  }

  // 6. Parse JSON
  try {
    const parsedBody = JSON.parse(body)
    console.log("📡 Valid webhook:", parsedBody.type)

    if (parsedBody.type === 'payment.succeeded') {
      console.log("✅ Payment succeeded:", parsedBody.id)
      // await updateSupabase(parsedBody) // Your logic here
    }
    
    return { received: true }

  } catch (e) {
    console.error("❌ JSON parse error:", e)
    return { error: "Invalid payload" }
  }
})