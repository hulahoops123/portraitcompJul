<template>
  <!-- Top-Level Wrapper with Bubble Background -->
  <div class="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-transparent">

    <!-- Bubble Background -->
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

    <!-- Curtain Gate -->

    <!-- Auth UI -->
    <div 
      class="relative z-10 w-full max-w-3xl mx-auto mt-12 bg-white/50 backdrop-blur-md p-8 shadow-xl border border-gray-300 font-playfair">

     <h1 class="text-4xl font-semibold text-gray-800 text-center mb-8 tracking-tight font-playfair">
  🎨 Portrait Competition
</h1>

<section class="mb-6">
  <h2 class="text-xl font-semibold text-gray-700 tracking-tight mb-2">🎯 Purpose</h2>
  <p class="text-gray-800">
    This one-day session is being held to help sustain the studio during quiet weeks—
    and to offer paid work to a model who has few other ways to earn.
  </p>
</section>

<section class="mb-6">
  <h2 class="text-xl font-semibold text-gray-700 tracking-tight mb-2">🙋 Who It's For</h2>
  <p class="text-gray-800">
    Open to artists from the studio, drawing class, and the broader Durban art community.
    A minimum of 6 artists is needed to go ahead. Maximum: 8 participants.
  </p>
</section>

<section class="mb-6">
  <h2 class="text-xl font-semibold text-gray-700 tracking-tight mb-2">📅 Date & Location</h2>
  <ul class="list-disc list-inside text-gray-800">
    <li><strong>Date:</strong> Wednesday, 6 August</li>
    <li><strong>Setup:</strong> From 8:30 AM</li>
    <li><strong>Start Time:</strong> Painting begins at 9:00 AM sharp</li>
    <li><strong>Venue:</strong> D. Donaldson Studio (above The Breakfast Room)</li>
  </ul>
</section>

<section class="mb-6">
  <h2 class="text-xl font-semibold text-gray-700 tracking-tight mb-2">🎨 Format & Materials</h2>
  <p class="text-gray-800">
    The model has a physical disability. Please approach the session with sensitivity and care.
  </p>
  <p class="text-gray-800 mt-2">
    There will be two painting sessions, each one hour long, with a 30-minute break in between.
  </p>
  <p class="mt-2 font-medium text-gray-900">Bring your own canvas and paints.</p>
</section>

<section class="mb-6">
  <h2 class="text-xl font-semibold text-gray-700 tracking-tight mb-2">🏆 Judging & Prize</h2>
  <p class="text-gray-800">
    Judged by <strong>Dee Donaldson</strong>. The winner will receive a <strong>primed A0 canvas</strong>—ready for a bold new work.
  </p>
</section>

<p class="italic text-sm text-gray-500 mb-8">
  This is a private event. If this message reached you, it means you're warmly invited to take part.
</p>

<div class="flex justify-center">
  <button @click="signInWithGoogle" :disabled="loading"
    class="relative inline-flex items-center justify-center px-6 py-2 font-semibold tracking-wide text-gray-200 bg-gradient-to-br from-indigo-800/90 to-blue-700/90 shadow-md hover:shadow-lg hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-800 rounded-none transition-all duration-200 ease-in-out">
    <Icon name="logos:google-icon" class="mr-2 w-5 h-5" />
    <span class="relative z-10">Sign in with Google</span>
  </button>
</div>



      <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700">
        {{ error }}
      </div>
    </div>

  </div>
</template>



<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const showCurtain = ref(true)
const curtainClicked = ref(false)
const passwordInput = ref('')
const passwordError = ref(false)

const checkPassword = () => {
  if (passwordInput.value.trim().toLowerCase() === 'crimson') {
    passwordError.value = false
    curtainClicked.value = true
    setTimeout(() => {
      showCurtain.value = false
    }, 1200)
  } else {
    passwordError.value = true
  }
}


const openCurtain = () => {
  curtainClicked.value = true
  setTimeout(() => {
    showCurtain.value = false
  }, 1200)
}

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''

  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  if (authError) {
    error.value = authError.message
  }

  loading.value = false
}

watch(user, (newUser) => {
  if (newUser) {
    router.push('/stage')
  }
}, { immediate: true })
</script>

<style scoped>
@keyframes move {
  100% {
    transform: translate3d(0, 0, 1px) rotate(360deg);
  }
}

.background {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background: #4c6c6c;
  overflow: hidden;
  z-index: -10;
}

.ball {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(200, 216, 255, 0.8), rgba(200, 216, 255, 0.1));
  animation: float 15s infinite ease-in-out;
  opacity: 0.3;
}

.ball:nth-child(odd) {
  color: #006D5B;
}

.ball:nth-child(even) {
  color: #FF6F61;
}

.ball:nth-child(1) {
  top: 77%;
  left: 88%;
  animation-duration: 40s;
  animation-delay: -3s;
  transform-origin: 16vw -2vh;
  box-shadow: 40vmin 0 5.703076368487546vmin currentColor;
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

:root {
  --accent: hsl(360, 80%, 50%);
  --accent-dark: hsl(360, 80%, 38%);
  --accent-light: hsl(360, 80%, 70%);
}

.rnOuter {
  background: var(--accent-dark);
  overflow: hidden;
  position: absolute;
  height: 100vh;
  width: 100%;
  z-index: 50;
  transition: transform 1.2s ease;
}

.rnOuter.clicked .rnInner {
  transform: scaleX(0);
}

.rnOuter.clicked .aoTableCell {
  color: white;
}

.aoTable {
  display: table;
  width: 100%;
  height: 100vh;
  text-align: center;
  z-index: 20;
  position: relative;
}

.aoTableCell {
  color: var(--accent-dark);
  display: table-cell;
  vertical-align: middle;
  transition: color 3s ease;
  font-size: 1.5rem;
  font-weight: bold;
}

.rnInner {
  width: 100vw;
  position: absolute;
  top: -10%;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  transform-style: preserve-3d;
  transition: transform 1.2s ease;
  transform-origin: -120% top;
}

.rnUnit {
  width: 10vw;
  height: 120vh;
  display: inline-block;
  background: repeating-linear-gradient(to left,
      hsl(360, 80%, 50%) 4vw,
      hsl(360, 80%, 38%) 8vw,
      hsl(360, 80%, 70%) 10vw);
  animation: rnUnit 2s ease infinite;
  transform-origin: 0 0%;
  transform: rotate(3deg);
}


@keyframes rnUnit {
  50% {
    transform: rotate(-3deg);
  }
}
</style>
