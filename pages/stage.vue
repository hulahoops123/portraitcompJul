<template>
  <div class="min-h-screen p-6 bg-gray-100/10">
    <!-- Bubble Background Layer -->
    <div class="background fixed inset-0 -z-10 pointer-events-none">
      <span class="ball"></span>
      <span class="ball"></span>
      <span class="ball"></span>
      <span class="ball"></span>
      <span class="ball"></span>
      <span class="ball"></span>
      <span class="ball"></span>
      <span class="ball"></span>
    </div>

    <div class="max-w-5xl mx-auto flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">{{ competitionTitle }}</h1>
        <h4 class="text-3xl font-bold text-gray-800">{{ competitionTag }}</h4>
        <button @click="signOut" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Logout
        </button>
      </div>

      <!-- Model's Card -->
      <!-- Model's Card -->
      <div class="mb-10">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">Just MJ</h2>
        <div class="w-full max-w-2xl rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
          <img src="/images/model.jpg" alt="Model" class="w-full h-52 object-cover" />
          <div class="p-3">
            <p class="text-gray-600 text-sm">
              He says it stands for Michael Jordan 🤷‍♂️
            </p>
          </div>
        </div>
      </div>


      <!-- CTA Button -->
      <div class="text-center mb-12">
        <button @click="enterCompetition" :disabled="buttonDisabled"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
          {{ buttonText }}
        </button>
      </div>

      <!-- Competition Easels -->
      <div class="grid grid-cols-4 gap-6 mb-12">
        <div v-for="i in maxCompetitors" :key="i" class="flex flex-col items-center relative group">
          <!-- Easel Frame -->
          <div class="w-24 h-24 border-4 rounded-lg shadow-lg bg-white overflow-hidden z-10">
            <img v-if="entered[i - 1]" :src="entered[i - 1].profile_pic" alt="Contestant"
              class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-sm">
              Empty
            </div>
          </div>

          <!-- Easel Stand -->
          <div class="w-1 h-8 bg-gray-700 mt-1"></div>
          <div class="w-10 h-1 bg-gray-700 mt-1"></div>

          <!-- Contestant Name -->
          <div v-if="entered[i - 1]"
            class="mt-2 text-sm text-gray-700 text-center truncate whitespace-nowrap max-w-[6rem]">
            {{ entered[i - 1].name.split(' ')[0] }}
          </div>
        </div>
      </div>

      <!-- Waiting Competitors -->
      <h2 class="text-xl font-semibold mb-4 text-gray-600 text-center">Still Deciding</h2>
      <div class="grid grid-cols-6 gap-4">
        <div v-for="user in waiting" :key="user.user_id"
          class="flex flex-col items-center opacity-60 hover:opacity-100 transition">
          <div class="w-14 h-14 rounded-full overflow-hidden border border-gray-300 grayscale">
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
const competitionTitle = ref('Beyond the Frame') // Set your competition title
const competitionTag = ref('A portrait series without boundaries') // Set your competition tag
const maxCompetitors = ref(8) // Set maximum competitors
const entryFeeCents = ref(20000) // Set entry fee in cents

// Core dependencies
const toast = useToast()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
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
<style>
.background {
  overflow: hidden;
}

.ball {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(200, 216, 255, 0.8), rgba(200, 216, 255, 0.1));
  animation: float 15s infinite ease-in-out;
  opacity: 0.3;
}

.ball:nth-child(1) {
  width: 150px;
  height: 150px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.ball:nth-child(2) {
  width: 200px;
  height: 200px;
  top: 70%;
  left: 20%;
  animation-delay: -3s;
}

.ball:nth-child(3) {
  width: 180px;
  height: 180px;
  top: 30%;
  left: 80%;
  animation-delay: -5s;
}

.ball:nth-child(4) {
  width: 120px;
  height: 120px;
  top: 80%;
  left: 70%;
  animation-delay: -7s;
}

.ball:nth-child(5) {
  width: 160px;
  height: 160px;
  top: 50%;
  left: 50%;
  animation-delay: -2s;
}

.ball:nth-child(6) {
  width: 90px;
  height: 90px;
  top: 15%;
  left: 65%;
  animation-delay: -4s;
}

.ball:nth-child(7) {
  width: 220px;
  height: 220px;
  top: 60%;
  left: 85%;
  animation-delay: -6s;
}

.ball:nth-child(8) {
  width: 140px;
  height: 140px;
  top: 85%;
  left: 40%;
  animation-delay: -1s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-50px) rotate(5deg);
  }
}
</style>