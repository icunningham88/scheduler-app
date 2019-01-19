<template>
    <div id="app">
        <transition-group tag="ul" class="content__list" name="event">
            <event-item
            v-for="item in displayedEvents"
            :key="item.date.format()+item.name"
            :event="item"
            >
            </event-item>
        </transition-group>
    </div>
</template>

<script>
import EventItem from './EventItem.vue'
import parser from 'cron-parser'
import moment from 'moment-timezone'
import { bus } from '../main';
export default {
    name: "EventList",
    props: {
        eventArray: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            // takes a moment object and string name
            displayedEvents: [],
            // cronArray is used to evaluate what's the next event
            // to add to the list that will be occurring
            // within the next 24 hours.
            cronArray: [],
            timezone: moment.tz.guess(),
            now: moment.tz(moment.tz.guess()),
            threeHoursPastNow: moment.tz(moment.tz.guess()).subtract(3, 'hours'),
            oneDayBeforeNow: moment.tz(moment.tz.guess()).add(24, 'hours'),
            nextEventIndex: 0
        }
    },
    created() {

        // Reset event times every minute
        // Moved to it's own method so we can 
        // test easier
        this.setEventCheckTimeIntervals();

        // Create cron array for future events to be updated
        this.createCronArray();
        
        // create list of events to be displayed
        this.initializeDisplayedEvents();
    },

    
    watch: {
        threeHoursPastNow: function() {
            this.checkForEventsToPop();
        },
        now: function() {
            this.checkForEventsToNotify();
        },
        oneDayBeforeNow: function() {
            // To store events that will need
            // to be displayed
            var addedEventArray = [];

            addedEventArray = this.checkForEventsToPush();
            
            // avoid a call to sort if we don't need it
            if (addedEventArray > 1) {
                this.sortOnDate(addedEventArray);
            }
            
            addedEventArray.forEach(event => {
                this.displayedEvents.push(event);
            });
        }
    },
    methods: {
        initializeDisplayedEvents() {
            // For the first part, we populate the display
            // array with events that have occurred within the
            // last 3 hours
            this.populateLastThreeHours();

            // The next event will be the first entry of 
            // the sorted results from populateNextDay()
            this.nextEventIndex = this.displayedEvents.length;

            // For the next step, we wish to populate the array
            // with events that will be occurring within the next
            // 24 hours.
            this.populateNextDay();

            this.sortOnDate(this.displayedEvents);

        },
        // Iterate through the events, creating cron parsers that
        // starts 3 hours before the current time and ends at the
        // current time
        populateLastThreeHours() {
            this.eventArray.forEach(event => {
                this.populateDisplayArrayByInterval(this.threeHoursPastNow, this.now, event, true, 10);
            })
        },
        // Iterate through the events, creating cron parsers that
        // starts at the current time and ends 24 hours later
        populateNextDay() {
            this.eventArray.forEach(event => {
                this.populateDisplayArrayByInterval(this.now, this.oneDayBeforeNow, event, false, 40);
            });
        },
        // Get the events that occur within a given segment of time
        populateDisplayArrayByInterval(start, end, cronEvent, isPastEvent, steps) {

            var interval = this.createCronParser(start, end, cronEvent.attributes.cron);
            var dates = interval.iterate(steps);
            dates.forEach(date => {
                var event = {
                    date: moment.tz(date.toISOString(), this.timezone),
                    name: cronEvent.attributes.name,
                    isPastEvent: isPastEvent
                }
                this.displayedEvents.push(event);
            });
        },

        // Creates the cron array that holds cron parsers
        // that compute future events.
        createCronArray() {
            var start = moment.tz(this.timezone).add(24, 'hours').toDate();
            this.eventArray.forEach(event => {
                var cron = event.attributes.cron;
                var name = event.attributes.name;
                var obj = {
                    cron: this.createFutureCronParser(start, cron),
                    name: name
                };
                this.cronArray.push(obj);
            });
        },

        // Creates cron parser, which provides us 
        // an iterable that will inform us of when
        // the next event will be and also let us know
        // when a previous event passed
        // https://github.com/harrisiirak/cron-parser
        createCronParser(start, end, cron) {
            var options = {
                currentDate: start,
                endDate: end,
                tz: this.timezone
            }
            return parser.parseExpression(cron, options);
        },

        // Cron parsers set 24 hours in advance
        // meant to run indefinitely
        createFutureCronParser(start, cron) {
            var options = {
                currentDate: start,
                tz: this.timezone
            }
            return parser.parseExpression(cron, options);
        },

        sortOnDate(arr) {
            arr.sort((left, right) => {
                return left.date.valueOf() - right.date.valueOf();
            })
        },

        // Reset the components data properties every minute.
        // The following properties are watched, so when we get an
        // update, we check the new times against the events within
        // the list
        setEventCheckTimeIntervals() {
            setInterval(() => this.now = moment.tz(this.timezone), 1000 * 60);
            setInterval(() => this.threeHoursPastNow = moment.tz(this.timezone).subtract(3, 'hours'), 1000 * 60);
            setInterval(() => this.oneDayBeforeNow = moment.tz(this.timezone).add(24, 'hours'), 1000 * 60);
        },

        // Remove events that occurred past 3 hours
        checkForEventsToPop() {
            var oldEvent = this.displayedEvents[0].date;
            if (oldEvent.isBefore(this.threeHoursPastNow)) {
                this.displayedEvents.shift();
                this.nextEventIndex--;
            }
        },

        // Send notifications for events occurring now
        checkForEventsToNotify() {
            var nextEvent = this.displayedEvents[this.nextEventIndex];
            if (nextEvent.date.isBefore(this.now)) {
                bus.$emit('display-notification', nextEvent);
                nextEvent.isPastEvent = true;
                this.nextEventIndex++;
            }
        },

        // Iterate through the cron parser
        // to check if any event is within 24 hours
        checkForEventsToPush() {
            var addedEvent = {};
            var addedEventArray = [];
            
            this.cronArray.forEach((event, index) => {
                var isoString = event.cron.next().toISOString();
                var date = moment.tz(isoString, this.timezone);
                if (date.isBefore(this.oneDayBeforeNow)) {
                    addedEvent = {
                        date: date,
                        name: event.name
                    }
                    addedEventArray.push(addedEvent);
                } else {
                    // Undo the time check for the next cron event
                    // if not within 24 hours
                    event.cron.prev();
                }
            });

            return addedEventArray;
        }

    },
    components: {
        'event-item': EventItem
    }
}
</script>
<style scoped>
ul {
    list-style-type: none;
    margin-bottom: 40px;
}
.event {
  backface-visibility: hidden;
  z-index: 1;
}

/* moving */
.event-move {
  transition: all 600ms ease-in-out 50ms;
}

/* appearing */
.event-enter-active {
  transition: all 400ms ease-out;
}

/* disappearing */
.event-leave-active {
  transition: all 200ms ease-in;
  position: absolute;
  z-index: 0;
}

/* appear at / disappear to */
.event-enter,
.event-leave-to {
  opacity: 0;
}
</style>