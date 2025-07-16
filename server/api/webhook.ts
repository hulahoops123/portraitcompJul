import crypto from 'crypto'
import { serverSupabaseClient } from '#supabase/server'

async function findNextAvailableSlot(supabase) {
  // get current slot numbers from participants
  const { data, error } = await supabase
    .from('participants')
    .select('slot_number')

  if (error) {
    console.error("❌ Failed to fetch slots:", error)
    throw new Error("Could not find available slot")
  }

  const takenSlots = data.map(p => p.slot_number)
  console.log("🎯 Taken slots:", takenSlots)

  for (let i = 1; i <= 8; i++) {
    if (!takenSlots.includes(i)) {
      return i
    }
  }

  throw new Error("No available slots")
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Yoco sends their signature here
  const signatureHeader = getHeader(event, 'x-yoco-signature')

  if (!signatureHeader) {
    console.log('❌ No signature header found. Rejecting.')
    return { error: 'Missing signature' }
  }

  // Get the raw body exactly as received
  const rawBody = await readRawBody(event)
  const secret = process.env.YOCO_WEBHOOK_SECRET as string

  // Compute HMAC SHA256
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody || '')
    .digest('hex')

  if (computedSignature !== signatureHeader) {
    console.log('❌ Invalid signature. Possible spoofed request.')
    return { error: 'Invalid signature' }
  }

  // Now safe to parse
  const body = JSON.parse(rawBody || '')
  console.log("📡 Verified Yoco webhook:", body)

  if (body.type === 'payment.succeeded') {
    console.log("✅ Payment succeeded:", body)

    // get user_id from metadata (if you stored it during createCheckout)
    const userId = body.payload.metadata.user_id

    if (!userId) {
      console.log("⚠️ No user_id in metadata. Skipping.")
      return { error: "Missing user_id" }
    }

    try {
      const slotNumber = await findNextAvailableSlot(supabase)

      const { data, error } = await supabase
        .from('participants')
        .insert([{ 
          user_id: userId,
          slot_number: slotNumber
        }] as any)

      if (error) {
        console.error("❌ Failed to insert participant:", error)
        return { error: "Failed to insert participant" }
      }

      console.log("🎉 User added to easel:", data)
    } catch (err) {
      console.error("❌ Could not place user on easel:", err)
      return { error: "No available slots" }
    }
  } else {
    console.log("ℹ️ Ignored event type:", body.type)
  }

  return { received: true }
})
