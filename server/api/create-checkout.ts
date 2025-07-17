export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.amount) {
    throw createError({ statusCode: 400, message: 'Amount is required.' })
  }
  const amount = body.amount

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
        cancelUrl: `${process.env.APP_URL}/stage?payment=cancel`,
        metadata: {
          userId: body.userId,
          name: body.name,
          profile_pic: body.profilePic
        }
      })
    })

    console.log('✅ Yoco response:', response)
    return response
  } catch (err) {
    console.error('❌ Error creating checkout:', err)
    if (err.response?._data) {
      console.error('❌ Full Yoco error response:', err.response._data)
    }
    return { error: 'Failed to create checkout' }
  }
})
