export const useWaitlistStore = defineStore('waitlist', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  const entries = ref([])
  const position = ref(null)
  const isOnWaitlist = ref(false)
  const loading = ref(false)

  const loadWaitlist = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('position')
      
      if (error) {
        console.error('Error loading waitlist:', error)
        return
      }
      
      entries.value = data || []
      
      if (user.value) {
        const userEntry = entries.value.find(entry => entry.user_id === user.value.id)
        isOnWaitlist.value = !!userEntry
        position.value = userEntry?.position || null
      }
    } finally {
      loading.value = false
    }
  }

  const joinWaitlist = async () => {
    if (!user.value || isOnWaitlist.value) return
    
    loading.value = true
    try {
      // Get next position
      const { data: lastEntry } = await supabase
        .from('waitlist')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .single()
      
      const nextPosition = (lastEntry?.position || 0) + 1
      
      const { error } = await supabase
        .from('waitlist')
        .insert({
          user_id: user.value.id,
          participant_name: user.value.email,
          position: nextPosition,
          joined_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Error joining waitlist:', error)
        return
      }
      
      await loadWaitlist()
    } finally {
      loading.value = false
    }
  }

  const leaveWaitlist = async () => {
    if (!user.value || !isOnWaitlist.value) return
    
    loading.value = true
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('user_id', user.value.id)
      
      if (error) {
        console.error('Error leaving waitlist:', error)
        return
      }
      
      await loadWaitlist()
    } finally {
      loading.value = false
    }
  }

  return {
    entries,
    position,
    isOnWaitlist,
    loading,
    loadWaitlist,
    joinWaitlist,
    leaveWaitlist
  }
})
