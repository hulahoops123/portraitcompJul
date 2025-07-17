import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

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

  // const supabase = useSupabaseClient()
  const userId = parsedBody?.metadata?.userId

  if (!userId) {
    console.error("❌ No userId found in webhook metadata")
    return { error: "Missing user info" }
  }

  try {
    // Step 1: Remove user from waiting
    await supabase
      .from('competition_participants')
      .delete()
      .match({ user_id: userId, status: 'waiting' })

    // Step 2: Add user to entered
    const { error: insertError } = await supabase
      .from('competition_participants')
      .insert({
        user_id: userId,
        name: parsedBody.metadata.name,
        profile_pic: parsedBody.metadata.profile_pic,
        status: 'entered'
      })

    if (insertError) throw insertError

    console.log(`✅ User ${userId} marked as 'entered'`)
  } catch (err) {
    console.error("❌ Failed to update participant status:", err)
    return { error: "Database update failed" }
  }
}

    
    return { received: true } // 200 OK

  } catch (e) {
    console.error("❌ JSON parse error:", e)
    return { error: "Invalid payload" }
  }
})