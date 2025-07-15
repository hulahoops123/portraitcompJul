export const useStageStore = defineStore('stage', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  const hasAccess = ref(false)
  const easels = ref([])
  const currentModel = ref(null)
  const loading = ref(false)

  const checkAccess = async () => {
    if (!user.value) return false
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('stage_access')
        .eq('user_id', user.value.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking stage access:', error)
        return false
      }
      
      hasAccess.value = data?.stage_access || false
      return hasAccess.value
    } finally {
      loading.value = false
    }
  }

  const requestAccess = async () => {
    if (!user.value) return
    
    loading.value = true
    try {
      const { error } = await supabase
        .from('participants')
        .upsert({
          user_id: user.value.id,
          email: user.value.email,
          stage_access_requested: true,
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Error requesting access:', error)
      }
    } finally {
      loading.value = false
    }
  }

  const loadEasels = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('easels')
        .select('*')
        .order('number')
      
      if (error) {
        console.error('Error loading easels:', error)
        return
      }
      
      easels.value = data || []
    } finally {
      loading.value = false
    }
  }

  const loadCurrentModel = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('is_current', true)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading current model:', error)
        return
      }
      
      currentModel.value = data
    } finally {
      loading.value = false
    }
  }

  const claimEasel = async (easelId) => {
    if (!user.value) return
    
    loading.value = true
    try {
      const { error } = await supabase
        .from('easels')
        .update({
          occupied: true,
          participant_id: user.value.id,
          claimed_at: new Date().toISOString()
        })
        .eq('id', easelId)
        .eq('occupied', false)
      
      if (error) {
        console.error('Error claiming easel:', error)
        return
      }
      
      await loadEasels()
    } finally {
      loading.value = false
    }
  }

  return {
    hasAccess,
    easels,
    currentModel,
    loading,
    checkAccess,
    requestAccess,
    loadEasels,
    loadCurrentModel,
    claimEasel
  }
})
