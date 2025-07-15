export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const amount = body?.amount || 5000  // e.g. R50.00 in cents

  try {
    const response = await $fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'ZAR',
        successUrl: `${process.env.APP_URL}/stage?payment=success`,
        cancelUrl: `${process.env.APP_URL}/stage?payment=cancel`
      })
    })

    return response
  } catch (err) {
    console.error('Error creating checkout:', err)
    return { error: 'Failed to create checkout' }
  }
})
