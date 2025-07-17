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

      const checkoutId = parsedBody.id

      // Find the user whose status is 'pending:{checkoutId}'
      const { data: pending, error: lookupError } = await supabase
        .from('competition_participants')
        .select('*')
        .like('status', `pending:${checkoutId}`)
        .maybeSingle()

      if (lookupError) {
        console.error("❌ DB lookup error:", lookupError)
      }
      if (!pending) {
        console.error("❌ No user found with matching pending status for checkout:", checkoutId)

        // Print ALL rows to see what’s going on
        const { data: allStatuses, error: dumpError } = await supabase
          .from('competition_participants')
          .select('user_id, status, name, profile_pic')

        if (dumpError) {
          console.error("❌ Failed to dump table:", dumpError)
        } else {
          console.log("🧾 Full competition_participants table dump:", allStatuses)
        }

        return { error: "No match for checkout ID" }
      }


      // Update user to 'entered'
      const { error: updateError } = await supabase
        .from('competition_participants')
        .update({ status: 'entered' })
        .eq('user_id', pending.user_id)

      if (updateError) {
        console.error("❌ Failed to update to entered:", updateError)
        return { error: "Update error" }
      }

      console.log("✅ User entered:", pending.user_id)
    }

    return { received: true } // 200 OK

  } catch (e) {
    console.error("❌ JSON parse error:", e)
    return { error: "Invalid payload" }
  }
})