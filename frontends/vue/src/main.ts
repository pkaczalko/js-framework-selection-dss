import './conduit.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth } from './stores/auth'

initAuth().finally(() => {
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
})
