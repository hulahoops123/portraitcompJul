<template>
  <NuxtPage />
</template>

<script setup>
onMounted(() => {
  if (!document.querySelector('script[src="https://js.yoco.com/sdk/v1/yoco-sdk-web.js"]')) {
    const script = document.createElement('script')
    script.src = 'https://js.yoco.com/sdk/v1/yoco-sdk-web.js'
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      console.log('✅ Yoco SDK loaded!')
    }
    script.onerror = () => {
      console.error('❌ Failed to load Yoco SDK')
    }
  }
})
</script>
