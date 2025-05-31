// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: '/mediamap-app/',
  },
  nitro: {
    preset: 'static',
  },
  devtools: { enabled: true },
  css: [
    '~/assets/css/base.css',
    '~/assets/css/responsive.css'
  ]
})
