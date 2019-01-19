<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <h2>Your Events</h2>
    <!-- We don't want to pass the response until it is initialized -->
    <event-list v-if="this.eventResponse.length > 0" :event-array="eventResponse">
    </event-list>
  </div>
</template>

<script>
import axios from 'axios'
import EventList from './EventList.vue'
import { bus } from '../main';
export default {
  name: 'Scheduler',
  data () {
    return {
      msg: 'Welcome to Your Scheduler App',
      allowNotifications: 'granted',
      eventResponse: [],
      interval: '',
      count: 0
    }
  },

  created() {
    axios.get("https://scheduler-challenge.herokuapp.com/schedule")
    .then(result => {
      var events = result.data.data;
      var indexOfShortCronFormat = events.findIndex(event => event.attributes.cron.split(' ').length == 4);
      if (indexOfShortCronFormat !== -1 ) {
        var updatedCron = events[indexOfShortCronFormat].attributes.cron + " *";
        events[indexOfShortCronFormat].attributes.cron = updatedCron;
      }
      this.eventResponse = events;
      Notification.requestPermission().then(userResponse => {
        this.allowNotification = userResponse;
      });
    })

    bus.$on('display-notification', event => {
      if (this.allowNotifications === 'granted') {
        var notification = new Notification(event.name);
      }
    })
  },

  /*mounted() {
    this.$on('display-notification', event => {
      if (this.allowNotifications === 'granted') {
        var notification = new Notification(event.name);
        notification.show();
      }
    })
  },*/
  methods: {
    
    displayNotificationFromCronJob(response) {
      if (response === 'granted') {
         var notification = new Notification("Hi there!");
      }
    }
  },
  components: {
    'event-list': EventList
  }
}
  </script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
