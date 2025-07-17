export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.amount) {
    throw createError({ statusCode: 400, message: 'Amount is required.' })
  }
  
  const amount = body.amount
  const user = event.context.user // Assuming you have auth middleware setting this
  const competitionId = 'default' // Or pass this in the body if you have multiple competitions

  if (!user?.id) {
    throw createError({ statusCode: 401, message: 'User authentication required.' })
  }

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
          userId: user.id,
          competitionId: competitionId,
          userEmail: user.email,
          // Add any other relevant metadata
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
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to create checkout',
      data: err.response?._data || null
    })
  }
})