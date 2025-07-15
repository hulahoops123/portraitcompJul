export const useSlotsStore = defineStore('slots', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  const availableSlots = ref([])
  const bookedSlots = ref([])
  const loading = ref(false)

  const loadSlots = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .order('time')
      
      if (error) {
        console.error('Error loading slots:', error)
        return
      }
      
      availableSlots.value = data?.filter(slot => !slot.booked) || []
      bookedSlots.value = data?.filter(slot => slot.booked) || []
    } finally {
      loading.value = false
    }
  }

  const bookSlot = async (slotId) => {
    if (!user.value) return
    
    loading.value = true
    try {
      const { error } = await supabase
        .from('slots')
        .update({
          booked: true,
          participant_id: user.value.id,
          booked_at: new Date().toISOString()
        })
        .eq('id', slotId)
        .eq('booked', false)
      
      if (error) {
        console.error('Error booking slot:', error)
        return
      }
      
      await loadSlots()
    } finally {
      loading.value = false
    }
  }

  const cancelSlot = async (slotId) => {
    if (!user.value) return
    
    loading.value = true
    try {
      const { error } = await supabase
        .from('slots')
        .update({
          booked: false,
          participant_id: null,
          booked_at: null
        })
        .eq('id', slotId)
        .eq('participant_id', user.value.id)
      
      if (error) {
        console.error('Error canceling slot:', error)
        return
      }
      
      await loadSlots()
    } finally {
      loading.value = false
    }
  }

  return {
    availableSlots,
    bookedSlots,
    loading,
    loadSlots,
    bookSlot,
    cancelSlot
  }
})
