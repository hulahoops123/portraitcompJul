export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log("📡 Received Yoco webhook:", body)

  if (body.type === 'payment.succeeded') {
    console.log("✅ Payment succeeded:", body)
    // TODO: update Supabase here
  } else {
    console.log("ℹ️ Ignored event type:", body.type)
  }

  return { received: true }
})
