<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-6xl mx-auto">
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Portrait Competition Stage</h1>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">{{ user?.email }}</span>
          <button 
            @click="signOut"
            class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div v-if="!stageStore.hasAccess" class="text-center">
        <div class="bg-white rounded-lg shadow-md p-8">
          <h2 class="text-xl font-semibold mb-4">Stage Access Required</h2>
          <p class="text-gray-600 mb-6">You need permission to access the stage.</p>
          <button 
            @click="requestAccess"
            :disabled="requesting"
            class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ requesting ? 'Requesting...' : 'Request Access' }}
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Model Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Model</h2>
          <div v-if="stageStore.currentModel" class="text-center">
            <div class="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Icon name="mdi:account" class="text-4xl text-gray-500" />
            </div>
            <p class="font-medium">{{ stageStore.currentModel.name }}</p>
            <p class="text-sm text-gray-600">Session: {{ stageStore.currentModel.session_time }}min</p>
          </div>
          <div v-else class="text-center text-gray-500">
            No model assigned
          </div>
        </div>

        <!-- Easels Section -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Easels</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div 
              v-for="easel in stageStore.easels" 
              :key="easel.id"
              class="border-2 rounded-lg p-4 text-center"
              :class="easel.occupied ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'"
            >
              <div class="w-16 h-20 bg-gray-200 mx-auto mb-2 rounded"></div>
              <p class="text-sm font-medium">Easel {{ easel.number }}</p>
              <p class="text-xs" :class="easel.occupied ? 'text-red-600' : 'text-green-600'">
                {{ easel.occupied ? 'Occupied' : 'Available' }}
              </p>
              <button 
                v-if="!easel.occupied"
                @click="claimEasel(easel.id)"
                class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
              >
                Claim
              </button>
            </div>
          </div>
        </div>

        <!-- Slots & Waitlist -->
        <div class="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Session Slots</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium mb-2">Available Slots</h3>
              <div class="space-y-2">
                <div 
                  v-for="slot in slotsStore.availableSlots" 
                  :key="slot.id"
                  class="flex justify-between items-center p-3 border rounded"
                >
                  <span>{{ slot.time }} - {{ slot.duration }}min</span>
                  <button 
                    @click="bookSlot(slot.id)"
                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
            <div>
              <h3 class="font-medium mb-2">Waitlist ({{ waitlistStore.position }})</h3>
              <div class="space-y-2">
                <div 
                  v-for="entry in waitlistStore.entries" 
                  :key="entry.id"
                  class="flex justify-between items-center p-3 border rounded"
                >
                  <span>{{ entry.participant_name }}</span>
                  <span class="text-sm text-gray-600">Position {{ entry.position }}</span>
                </div>
              </div>
              <button 
                v-if="!waitlistStore.isOnWaitlist"
                @click="joinWaitlist"
                class="mt-4 w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const stageStore = useStageStore()
const slotsStore = useSlotsStore()
const waitlistStore = useWaitlistStore()

const requesting = ref(false)

onMounted(async () => {
  await Promise.all([
    stageStore.checkAccess(),
    stageStore.loadEasels(),
    stageStore.loadCurrentModel(),
    slotsStore.loadSlots(),
    waitlistStore.loadWaitlist()
  ])
})

const signOut = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

const requestAccess = async () => {
  requesting.value = true
  await stageStore.requestAccess()
  requesting.value = false
}

const claimEasel = async (easelId) => {
  await stageStore.claimEasel(easelId)
}

const bookSlot = async (slotId) => {
  await slotsStore.bookSlot(slotId)
}

const joinWaitlist = async () => {
  await waitlistStore.joinWaitlist()
}
</script>
