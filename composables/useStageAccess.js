export const useStageAccess = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  const checkAccess = async () => {
    if (!user.value) return false
    
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
      
      return data?.stage_access || false
    } catch (error) {
      console.error('Error in checkAccess:', error)
      return false
    }
  }

  const requestAccess = async () => {
    if (!user.value) return false
    
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
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error in requestAccess:', error)
      return false
    }
  }

  return {
    checkAccess,
    requestAccess
  }
}
