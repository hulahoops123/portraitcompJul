<template>
  <div>
    <h1>Test Supabase</h1>
    <div v-if="participants.length > 0">
      <p>Successfully fetched {{ participants.length }} participants!</p>
    </div>
    <div v-else>
      <p>Loading or none found...</p>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const participants = ref([])

onMounted(async () => {
  const { data, error } = await supabase.from('participants').select('*')
  if (!error) participants.value = data
  console.log('Participants:', data)
})
</script>
