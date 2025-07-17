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
   },

  actions: {
    

  }
})