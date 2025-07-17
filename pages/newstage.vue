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
      </div>

      <!-- Waiting Competitors -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Waiting Area</h2>
      </div>
    </div>
    <div class="text-center">
      <button @click="enterCompetition" 
              :disabled="competitionFull"
              class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50">
        {{ competitionFull ? "Competition Full" : "Enter Competition & Pay" }}
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
const competitorsStore = useCompetitorsStore() // Handles competition state

// Current competitor data from auth
const currentCompetitorData = computed(() => ({
  id: user.value.id,
  user_id: user.value.id,
  name: user.value.user_metadata.full_name,
  profile_pic: user.value.user_metadata.avatar_url,
  // Additional competition-specific fields can be added:
}))


// Handle competition entry with payment
const enterCompetition = async () => {
  try {
    const response = await $fetch('/api/create-checkout', {
      method: 'POST',
      body: { amount: entryFeeCents.value }
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
</script>