import axios from 'axios'

export default {
    // Returns a promise with the event data
    getDayEvents(url) {
        return axios.get(url);
    }
}