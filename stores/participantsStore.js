import { defineStore } from 'pinia'
import { useSupabaseClient, useSupabaseUser } from '#imports'

export const useParticipantsStore = defineStore('participants', {
  state: () => ({
    participants: []
  }),

  getters: {
    easelParticipants(state) {
      return state.participants.filter(p => p.slot_number !== null)
    },
    waitingParticipants(state) {
      return state.participants.filter(p => p.slot_number === null)
    },
    slotsFull(state) {
      return this.easelParticipants.length >= 8
    }
  },

  actions: {
    async fetchParticipants() {
      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('participants')
        .select('*')
      if (!error) {
        this.participants = data
      } else {
        console.error('Error loading participants:', error)
      }
    },

    async claimSlot() {
      const supabase = useSupabaseClient()
      const user = useSupabaseUser().value

      if (!user) {
        console.error('No user logged in')
        return
      }

      // find first available slot
      const occupied = this.easelParticipants.map(p => p.slot_number)
      const slotNumber = [1,2,3,4,5,6,7,8].find(n => !occupied.includes(n))
      if (!slotNumber) {
        console.log('All slots full')
        return
      }

      const { error } = await supabase
        .from('participants')
        .insert({
          user_id: user.id,
          name: user.user_metadata.full_name,
          email: user.email,
          profile_pic: user.user_metadata.avatar_url,
          slot_number: slotNumber,
          paid: true
        })

      if (error) {
        console.error('Error claiming slot:', error)
      } else {
        await this.fetchParticipants()
      }
    }
  }
})
