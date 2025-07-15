export const useYocoPayment = () => {
  const startPayment = () => {
    if (!window.Yoco) {
      console.error('Yoco SDK not loaded')
      return
    }

    const yoco = new window.YocoSDK({
      publicKey: 'pk_test_ea9110576BW41BaC8414' // <-- your public key
    })

    yoco.showPopup({
      amountInCents: 5000,  // 50.00 currency units
      currency: 'ZAR',
      name: 'Portrait Competition Slot'
    }, (result) => {
      if (result.error) {
        console.error('Payment error:', result.error.message)
      } else {
        console.log('Payment success, token:', result.id)
        // Next: send this token to your server to charge
      }
    })
  }

  return { startPayment }
}
