import Vue from 'vue'
import Router from 'vue-router'
import Scheduler from '@/components/Scheduler'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Scheduler',
      component: Scheduler
    }
  ]
})
