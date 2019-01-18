<template>
    <li class="event">
        <div class="event__text" :class="{'past': event.isPastEvent}">
            <div>{{ event.name }}</div> <div>{{ event.date.format() }}</div>
        </div>
    </li>
</template>
<script>
import moment from 'moment-timezone'
import { bus } from '../main';
export default {
    name: "EventItem",
    props: {
        event: {
            type: Object,
            required: false
        }
    }
}
</script>
<style>
.event {
    background-color: #fff;
    border-bottom: 1px solid #eee;
    width: 25%;
    margin: 0 auto;
}

.event__text {
    padding: 10px 0;
}

.past {
    opacity: .4;
}
</style>

