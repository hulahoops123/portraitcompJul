<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <div class="max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">{{ competitionTitle }}</h1>
        <button @click="signOut" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Logout
        </button>
      </div>

      <!-- Competition Slots -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Entered Contestants</h2>
        <div class="grid grid-cols-4 gap-4">
          <div v-for="(slot, index) in availableSlots" :key="'slot-'+index" 
               class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-32">
            <template v-if="slot">
              <img :src="slot.profile_pic" :alt="slot.name" class="w-16 h-16 rounded-full mb-2">
              <span class="text-sm font-medium">{{ slot.name }}</span>
            </template>
            <template v-else>
              <span class="text-gray-400">Slot {{ index + 1 }}</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Waiting Competitors -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Waiting Area</h2>
        <div v-if="waiting.length > 0" class="flex flex-wrap gap-4">
          <div v-for="competitor in waiting" :key="competitor.id" 
               class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <img :src="competitor.profile_pic" :alt="competitor.name" class="w-12 h-12 rounded-full">
            <span>{{ competitor.name }}</span>
          </div>
        </div>
        <div v-else class="text-gray-500">
          No competitors in waiting area
        </div>
      </div>
    </div>
    <div class="text-center">
      <button @click="enterCompetition" 
              :disabled="competitionFull || isCurrentUserEntered"
              class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup>
// Auth middleware - keeps the auth requirement
definePageMeta({
  middleware: 'auth'
})

// Configuration - customize these per competition
const competitionTitle = ref('Annual Art Competition') // Set your competition title
const maxCompetitors = ref(8) // Set maximum competitors
const entryFeeCents = ref(200) // Set entry fee in cents

// Core dependencies
const toast = useToast()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const competitorsStore = useCompetitorsStore()

// Initialize store
competitorsStore.maxCompetitors = maxCompetitors.value
await competitorsStore.fetchCompetitors()

// Current competitor data from auth
const currentCompetitorData = computed(() => ({
  id: user.value.id,
  user_id: user.value.id,
  name: user.value.user_metadata.full_name,
  profile_pic: user.value.user_metadata.avatar_url,
}))

// Computed properties
const waiting = computed(() => competitorsStore.waiting)
const entered = computed(() => competitorsStore.entered)
const availableSlots = computed(() => competitorsStore.availableSlots)
const competitionFull = computed(() => competitorsStore.competitionFull)
const isCurrentUserEntered = computed(() => 
  entered.value.some(c => c.user_id === user.value.id) ||
  waiting.value.some(c => c.user_id === user.value.id)
)

const buttonText = computed(() => {
  if (isCurrentUserEntered.value) return "You're already entered"
  if (competitionFull.value) return "Competition Full"
  return "Enter Competition & Pay"
})

// Handle competition entry with payment
const enterCompetition = async () => {
  try {
    // First add to waiting area
    await competitorsStore.addCompetitor(currentCompetitorData.value)
    
    // Then initiate payment
    const response = await $fetch('/api/create-checkout', {
      method: 'POST',
      body: { 
        amount: entryFeeCents.value,
        userId: user.value.id,
        competitionId: 'default' // or your competition ID
      }
    })

    if (!response?.redirectUrl) {
      toast.error({
        title: "Payment Failed",
        message: "Could not process your entry payment."
      })
      return
    }

    // Store payment attempt in localStorage
    localStorage.setItem('competitionPaymentAttempted', 'true')
    window.location.href = response.redirectUrl
    
  } catch (err) {
    console.error('Entry error:', err)
    toast.error({
      title: "Entry Failed",
      message: "Could not process your competition entry."
    })
  }
}

// Helpers
const signOut = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

// Handle payment success callback
onMounted(async () => {
  const paymentAttempted = localStorage.getItem('competitionPaymentAttempted')
  const urlParams = new URLSearchParams(window.location.search)
  const paymentSuccess = urlParams.get('payment_success')
  
  if (paymentAttempted && paymentSuccess === 'true') {
    // Move from waiting to entered
    await competitorsStore.moveToEntered(user.value.id)
    localStorage.removeItem('competitionPaymentAttempted')
    
    // Clean URL
    const cleanUrl = window.location.origin + window.location.pathname
    window.history.replaceState({}, document.title, cleanUrl)
    
    toast.success({
      title: "Payment Successful",
      message: "You've been entered into the competition!"
    })
  } else if (paymentAttempted && paymentSuccess === 'false') {
    toast.error({
      title: "Payment Failed",
      message: "Your payment was not successful."
    })
    localStorage.removeItem('competitionPaymentAttempted')
  }
})
</script>