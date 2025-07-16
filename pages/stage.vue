<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <div class="max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Portrait Competition Stage</h1>
        <button @click="signOut" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Logout
        </button>
      </div>

      <div class="grid grid-cols-4 gap-4 mb-8">
        <div v-for="n in 8" :key="n" class="h-28 flex flex-col items-center justify-center border rounded-lg"
          :class="easelClasses(n)">
          <div v-if="getParticipantBySlot(n)">
            <img :src="getParticipantBySlot(n).profile_pic" class="w-12 h-12 rounded-full mb-2" alt="Profile" />
            <p class="text-sm">{{ getParticipantBySlot(n).name }}</p>
          </div>
          <div v-else class="text-gray-400 text-sm">Empty Slot {{ n }}</div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Waiting Area</h2>
        <div class="flex flex-wrap gap-4">
          <div v-for="participant in waitingParticipantsWithSelf" :key="participant.id"
            class="flex flex-col items-center">
            <img :src="participant.profile_pic" class="w-12 h-12 rounded-full mb-2" alt="Waiting User" />
            <p class="text-xs">{{ participant.name }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="p-4 border rounded-lg mt-6 bg-gray-50">
      <h3 class="font-bold mb-2">🚀 Developer Toast Test</h3>
      <button @click="showSuccess" class="mr-2 px-4 py-2 bg-green-500 text-white rounded">
        Show Success
      </button>
      <button @click="showError" class="px-4 py-2 bg-red-500 text-white rounded">
        Show Error
      </button>
    </div>
    <div class="text-center">
      <button @click="enterStage" :disabled="slotsFull"
        class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50">
        {{ slotsFull ? "Stage is full" : "Enter Stage & Purchase" }}
      </button>
    </div>
  </div>

</template>

<script setup>
import { useToast } from "vue-toastification"

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const toast = useToast()

const participantsStore = useParticipantsStore()

onMounted(async () => {
  await participantsStore.fetchParticipants()

  if (localStorage.getItem('paymentAttempted') === 'true') {
    localStorage.removeItem('paymentAttempted')
    toast.success("🎉 Congratulations! You're on stage. A receipt has been emailed to you. Good luck!")
  }
})

const slotsFull = computed(() => participantsStore.slotsFull)

const getParticipantBySlot = (slotNumber) => {
  return participantsStore.easelParticipants.find(p => p.slot_number === slotNumber)
}

const easelClasses = (n) => {
  return getParticipantBySlot(n)
    ? 'border-green-400 bg-green-50'
    : 'border-gray-300 bg-white'
}

const waitingParticipantsWithSelf = computed(() => {
  const existing = participantsStore.waitingParticipants
  const onEasel = participantsStore.easelParticipants.find(p => p.user_id === user.value.id)
  const alreadyIn = existing.find(p => p.user_id === user.value.id)
  if (!onEasel && !alreadyIn) {
    return [
      ...existing,
      {
        id: user.value.id,
        user_id: user.value.id,
        name: user.value.user_metadata.full_name,
        profile_pic: user.value.user_metadata.avatar_url
      }
    ]
  }
  return existing
})

const showSuccess = () => {
  console.log("✅ Clicked success toast")
  toast.success("🎉 Success toast works!")
}

const showError = () => {
  console.log("❌ Clicked error toast")
  toast.error("🚨 Error toast works!")
}

// const ENTRY_FEE_CENTS = 7500  // R75.00
const ENTRY_FEE_CENTS = 500  // dev_test


const enterStage = async () => {
  if (slotsFull.value) {
    toast.error("Sorry, all slots are currently full.")
    return
  }

  try {
    const response = await $fetch('/api/create-checkout', {
      method: 'POST',
      body: { amount: ENTRY_FEE_CENTS }
    })

    console.log('✅ Checkout response:', response)

    if (!response?.redirectUrl) {
      toast.error("Could not get payment link.")
      return
    }

    localStorage.setItem('paymentAttempted', 'true')
    window.location.href = response.redirectUrl
  } catch (err) {
    console.error('Checkout error:', err)
    toast.error("Something went wrong starting your payment.")
  }
}


const signOut = async () => {
  await supabase.auth.signOut()
  router.push('/')
}
</script>
