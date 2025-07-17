<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <div class="max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">{{ competitionTitle }}</h1>
        <button @click="signOut" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Logout
        </button>
      </div>
      <div class="text-center">
        <button @click="enterCompetition" :disabled="buttonDisabled"
          class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50">
          {{ buttonText }}
        </button>

      </div>

      <!-- Competition Slots -->
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in maxCompetitors" :key="i" class="flex flex-col items-center">
          <div v-if="entered[i - 1]" class="w-20 h-20 rounded-full overflow-hidden border">
            <img :src="entered[i - 1].profile_pic" alt="Contestant" class="w-full h-full object-cover" />
          </div>
          <div v-else
            class="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            Empty
          </div>
        </div>
      </div>

      <!-- Waiting Competitors -->
      <div class="grid grid-cols-6 gap-4">
        <div v-for="user in waiting" :key="user.user_id" class="flex flex-col items-center">
          <div class="w-16 h-16 rounded-full overflow-hidden border">
            <img :src="user.profile_pic" alt="Waiting" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

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
const entered = ref([])
const waiting = ref([])

const loadParticipants = async () => {
  const { data: enteredData } = await supabase
    .from('competition_participants')
    .select('*')
    .eq('status', 'entered')
    .order('inserted_at', { ascending: true })

  const { data: waitingData } = await supabase
    .from('competition_participants')
    .select('*')
    .eq('status', 'waiting')
    .order('inserted_at', { ascending: true })

  entered.value = enteredData || []
  waiting.value = waitingData?.filter(p => !entered.value.find(e => e.user_id === p.user_id)) || []
}

onMounted(async () => {
  const { data: existing } = await supabase
    .from('competition_participants')
    .select('status')
    .eq('user_id', user.value.id)
    .single()

  if (!existing || (existing.status !== 'entered' && !existing.status.startsWith('pending:'))) {
    const { error: insertError } = await supabase
      .from('competition_participants')
      .upsert({
        user_id: user.value.id,
        name: user.value.user_metadata.full_name,
        profile_pic: user.value.user_metadata.avatar_url,
        status: 'waiting'
      }, { onConflict: ['user_id'] })

    if (insertError) {
      console.error("❌ Failed to add user to waiting:", insertError)
    } else {
      console.log("✅ Added user to waiting list")
    }
  }

  await loadParticipants()
})


// Initialize store

// Current competitor data from auth
const currentCompetitorData = computed(() => ({
  id: user.value.id,
  user_id: user.value.id,
  name: user.value.user_metadata.full_name,
  profile_pic: user.value.user_metadata.avatar_url,
}))


const hasEntered = computed(() =>
  entered.value.some(p => p.user_id === user.value.id)
)

const competitionFull = computed(() =>
  entered.value.length >= maxCompetitors.value
)

const buttonText = computed(() => {
  if (hasEntered.value) return 'You have already entered'
  if (competitionFull.value) return 'Sorry, all spaces are taken'
  return 'Buy Ticket'
})

const buttonDisabled = computed(() =>
  hasEntered.value || competitionFull.value
)

// Handle competition entry with payment
const enterCompetition = async () => {
  try {
    // Initiate payment
    const response = await $fetch('/api/create-checkout', {
      method: 'POST',
      body: {
        amount: entryFeeCents.value,
        userId: user.value.id,
        name: user.value.user_metadata.full_name,
        profilePic: user.value.user_metadata.avatar_url,
        competitionId: 'default'
      }
    })

    if (!response?.redirectUrl) {
      toast.error({
        title: "Payment Failed",
        message: "Could not process your entry payment."
      })
      return
    }
    // ✅ INSERT THIS HERE: mark user as pending
    await supabase
      .from('competition_participants')
      .upsert({
        user_id: user.value.id,
        name: user.value.user_metadata.full_name,
        profile_pic: user.value.user_metadata.avatar_url,
        status: `pending:${response.id}`
      }, { onConflict: ['user_id'] })

    //redirect to yoco
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
  // Remove from waiting list before logging out
  await supabase
    .from('competition_participants')
    .delete()
    .match({ user_id: user.value.id, status: 'waiting' })

  await supabase.auth.signOut()
  router.push('/')
}

</script>