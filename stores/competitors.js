// stores/competitors.js
import { defineStore } from 'pinia'
import { useSupabaseClient } from '#imports'

export const useCompetitorsStore = defineStore('competitors', {
  state: () => ({
    waiting: [],    // Users in waiting area
    entered: [],    // Users who have entered
    maxCompetitors: 8,
    loading: false,
    error: null
  }),

  getters: {
    competitionFull: (state) => state.entered.length >= state.maxCompetitors,
    availableSlots: (state) => {
      const slots = Array(state.maxCompetitors).fill(null)
      state.entered.forEach((competitor, index) => {
        if (index < state.maxCompetitors) {
          slots[index] = competitor
        }
      })
      return slots
    }
  },

  actions: {
    async fetchCompetitors(competitionId = 'default') {
      this.loading = true
      this.error = null
      const supabase = useSupabaseClient()
      
      try {
        // Fetch both waiting and entered competitors in one query
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .eq('competition_id', competitionId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Separate into waiting and entered
        this.waiting = data.filter(c => c.status === 'waiting')
        this.entered = data.filter(c => c.status === 'entered')
        
      } catch (err) {
        this.error = err.message
        console.error('Error fetching competitors:', err)
      } finally {
        this.loading = false
      }
    },

    async addCompetitor(competitorData, competitionId = 'default') {
      const supabase = useSupabaseClient()
      
      try {
        // First add to waiting area
        const { data, error } = await supabase
          .from('competitions')
          .insert([{
            ...competitorData,
            competition_id: competitionId,
            status: 'waiting'
          }])
          .select()

        if (error) throw error

        // Update local state
        this.waiting.push(data[0])
        return data[0]
        
      } catch (err) {
        console.error('Error adding competitor:', err)
        throw err
      }
    },

    async moveToEntered(userId, competitionId = 'default') {
      const supabase = useSupabaseClient()
      
      try {
        // Update status in database
        const { data, error } = await supabase
          .from('competitions')
          .update({ 
            status: 'entered',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('competition_id', competitionId)
          .select()

        if (error) throw error

        // Update local state
        const movedCompetitor = this.waiting.find(c => c.user_id === userId)
        if (movedCompetitor) {
          this.waiting = this.waiting.filter(c => c.user_id !== userId)
          this.entered.push({ ...movedCompetitor, status: 'entered' })
        }
        
        return data[0]
        
      } catch (err) {
        console.error('Error moving competitor:', err)
        throw err
      }
    }
  }
})