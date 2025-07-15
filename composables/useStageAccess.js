export const useStageAccess = () => {
  const participantsStore = useParticipantsStore()
  const router = useRouter()
  const slotsFull = computed(() => participantsStore.slotsFull)

const startPayment = () => {
  return new Promise((resolve) => {
    if (typeof window.Yoco === 'undefined') {
      console.error('Yoco SDK still not ready. Try again in a sec.')
      resolve(false)
      return
    }

    const yoco = new window.YocoSDK({
      publicKey: 'pk_test_ea9110576BW41BaC8414'
    })

    yoco.showPopup({
      amountInCents: 5000,
      currency: 'ZAR',
      name: 'Portrait Competition Slot'
    }, async (result) => {
      if (result.error) {
        console.error('Payment error:', result.error.message)
        resolve(false)
      } else {
        console.log('Payment success, token:', result.id)
        resolve(true)
      }
    })
  })
}


  const enterStage = async () => {
    if (slotsFull.value) return

    const paid = await startPayment()
    if (!paid) return

    await participantsStore.claimSlot()
    router.push('/stage')
  }

  return {
    enterStage
  }
}
