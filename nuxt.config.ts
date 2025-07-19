// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    'nuxt-toast'
  ],
fonts: {
  families: [
    {
      name: 'Playfair Display',
      provider: 'google',
      weights: [400, 600],
    },
    {
      name: 'Raleway',
      provider: 'google',
      weights: [400, 700],
    }
  ]
},
  supabase: {
    redirect: false
  },
  runtimeConfig: {
    YOCO_SECRET_KEY: process.env.YOCO_SECRET_KEY,
    APP_URL: process.env.APP_URL
  }
})
