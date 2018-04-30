// @flow
import type {Container} from '../../../app/di'
import Vue from 'vue'
import axios from 'axios'
import App from '../../App'
import storeFactory from '../../store/factory'
import routerFactory from '../../router/factory'

function bootstrap (container: Container) {
  container.service(
    'vue-application',
    [],
    () => {
      if (!process.env.IS_WEB) {
        Vue.use(require('vue-electron'))
      }
      Vue.http = Vue.prototype.$http = axios
      Vue.config.productionTip = false

      return new Vue({
        components: {App},
        router: container.get('vue-router'),
        store: container.get('vue-store'),
        template: '<App/>',
        el: '#app'
      })
    }
  )

  container.service(
    'vue-store',
    ['tequilapi', 'rendererCommunication'],
    (tequilapi, rendererCommunication) => {
      return storeFactory(tequilapi, rendererCommunication)
    }
  )

  container.service(
    'vue-router',
    ['vue-store'],
    (store) => {
      return routerFactory(store)
    }
  )
}

export default bootstrap