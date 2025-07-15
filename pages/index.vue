<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-center mb-6">Portrait Competition</h1>
      
      <div v-if="user" class="text-center">
        <p class="mb-4">Welcome, {{ user.email }}!</p>
        <button 
          @click="goToStage"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mb-2"
        >
          Enter Stage
        </button>
        <button 
          @click="signOut"
          class="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Sign Out
        </button>
      </div>

      <div v-else>
        <!-- Password Auth -->
        <form @submit.prevent="signInWithPassword" class="mb-4">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input 
              v-model="email"
              type="email" 
              required
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
            >
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input 
              v-model="password"
              type="password" 
              required
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
            >
          </div>
          <button 
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="text-center mb-4">
          <span class="text-gray-500">or</span>
        </div>

        <!-- Google Auth -->
        <button 
          @click="signInWithGoogle"
          :disabled="loading"
          class="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
        >
          <Icon name="logos:google-icon" class="mr-2" />
          Sign in with Google
        </button>

        <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const signInWithPassword = async () => {
  loading.value = true
  error.value = ''
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  
  if (authError) {
    error.value = authError.message
  }
  
  loading.value = false
}

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''
  
  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/stage`
    }
  })
  
  if (authError) {
    error.value = authError.message
  }
  
  loading.value = false
}

const signOut = async () => {
  await supabase.auth.signOut()
}

const goToStage = () => {
  router.push('/stage')
}

// Redirect to stage if already authenticated
watch(user, (newUser) => {
  if (newUser) {
    router.push('/stage')
  }
}, { immediate: true })
</script>
