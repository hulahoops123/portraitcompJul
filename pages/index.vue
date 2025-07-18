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
    <div v-if="showCurtain" class="rnOuter" :class="{ clicked: curtainClicked }">
      <section class="aoTable">
        <div class="aoTableCell text-center px-4 ">
          <div class="bg-white/80 p-2">
            <h1 class="text-2xl font-bold mb-2 ">Apologies, this is a private event.</h1>

            <p class="mb-4">Please enter the password to continue</p>
            <input v-model="passwordInput" type="input" placeholder="Enter password"
              class="w-full max-w-xs mx-auto p-2 border rounded focus:outline-none focus:ring focus:ring-red-400" />
            <button @click="checkPassword"
              class="mt-3 w-full max-w-xs mx-auto bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">
              Submit
            </button>
            <div v-if="passwordError" class="mt-3 text-red-200 text-sm">
              Incorrect password. Please try again.
            </div>
          </div>

        </div>
      </section>

      <div class="rnInner">
        <div v-for="n in 10" :key="n" class="rnUnit" :style="{ animationDelay: `-${n * 0.1}s` }" />
      </div>
    </div>

    <!-- Auth UI -->
    <div v-show="!showCurtain"
      class="relative z-10 w-full max-w-3xl mx-auto mt-12 bg-white/50 backdrop-blur-md rounded-lg shadow-xl p-8">
      <h1 class="text-4xl font-bold text-center mb-8">🎨 Portrait Competition</h1>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">🙋 Who It's For</h2>
        <p>This exclusive, invitation-only event is open to artists from my studio and drawing class. Only 8
          participants will be selected.</p>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">📅 Date & Location</h2>
        <ul class="list-disc list-inside">
          <li><strong>Date:</strong> Wednesday, 6 August</li>
          <li><strong>Time:</strong> Starts 9:00 AM sharp</li>
          <li><strong>Venue:</strong> D. Donaldson Studio, above the Breakfast Room</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">🎨 Format & Materials</h2>
        <p>The model has a physical disability. Be thoughtful. Sessions are 2 hours, with a 30-minute break between.</p>
        <p class="mt-2 font-medium">Bring your own canvas and paints. Setup opens at 8:30 AM.</p>
      </section>

      <section class="mb-6">
        <h2 class="text-xl font-semibold mb-2">🏆 Judging & Prize</h2>
        <p>Judged by <strong>Dee Donaldson</strong>. The winner will receive a <strong>primed A0 canvas</strong>—ready
          for your next big work.</p>
      </section>

      <p class="italic text-sm text-gray-600 mb-8">This is a private event. If you're reading this, you're one of the
        chosen few.</p>

      <button @click="signInWithGoogle" :disabled="loading"
        class="w-full bg-red-600 text-white py-3 px-6 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center">
        <Icon name="logos:google-icon" class="mr-2" />
        Sign in with Google
      </button>

      <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
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
  background: #4CB8B6;
  overflow: hidden;
  z-index: -10;
}

.ball {
  position: absolute;
  width: 20vmin;
  height: 20vmin;
  border-radius: 50%;
  backface-visibility: hidden;
  animation: move linear infinite;
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
  top: 42%;
  left: 2%;
  animation-duration: 53s;
  animation-delay: -29s;
  transform-origin: -19vw 21vh;
  box-shadow: -40vmin 0 5.17594621519026vmin currentColor;
}

.ball:nth-child(3) {
  top: 28%;
  left: 18%;
  animation-duration: 49s;
  animation-delay: -8s;
  transform-origin: -22vw 3vh;
  box-shadow: 40vmin 0 5.248179047256236vmin currentColor;
}

.ball:nth-child(4) {
  top: 50%;
  left: 79%;
  animation-duration: 26s;
  animation-delay: -21s;
  transform-origin: -17vw -6vh;
  box-shadow: 40vmin 0 5.279749632220298vmin currentColor;
}

.ball:nth-child(5) {
  top: 46%;
  left: 15%;
  animation-duration: 36s;
  animation-delay: -40s;
  transform-origin: 4vw 0vh;
  box-shadow: -40vmin 0 5.964309466052033vmin currentColor;
}

.ball:nth-child(6) {
  top: 77%;
  left: 16%;
  animation-duration: 31s;
  animation-delay: -10s;
  transform-origin: 18vw 4vh;
  box-shadow: 40vmin 0 5.178483653434181vmin currentColor;
}

.ball:nth-child(7) {
  top: 22%;
  left: 17%;
  animation-duration: 55s;
  animation-delay: -6s;
  transform-origin: 1vw -23vh;
  box-shadow: -40vmin 0 5.703026794398318vmin currentColor;
}

.ball:nth-child(8) {
  top: 41%;
  left: 47%;
  animation-duration: 43s;
  animation-delay: -28s;
  transform-origin: 25vw -3vh;
  box-shadow: 40vmin 0 5.196265905749415vmin currentColor;
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
