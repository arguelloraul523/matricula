import { createApp } from 'vue'
import 'sweetalert2/dist/sweetalert2.min.css'
import './style.css'
import { Quasar } from 'quasar'
import App from './App.vue'
import {router}  from "./routes/routes.js"
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

const pinia  = createPinia()
const app = createApp(App)

app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
})

pinia.use(piniaPluginPersistedstate)
app.use(pinia)

app.use(router)

app.mount('#app')
