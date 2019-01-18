import { shallowMount } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { expect } from 'chai'
import sinon from 'sinon';
import parser from 'cron-parser'
import moment from 'moment-timezone'
import EventList from '../src/components/EventList.vue'
const mockResponse = require('../resources/eventResponse.json');

describe('Experiment with moment and cron-parser', () => {

    it('Convert cron formatted time to datetime', () => {
        var cronDate = "0 7 14 3 *";
        var timezone = moment.tz.guess();
        var options = {
            tz: timezone
        }
        var interval = parser.parseExpression(cronDate, options);
        expect(interval.next().toString()).to.equal('Thu Mar 14 2019 07:00:00 GMT-0400');
    })

    it('Compare converted Cron date with current time', () => {
        var cronDate = "0 7 14 3 *";
        var timezone = moment.tz.guess();
        var now = moment.tz("2019-01-13 11:55", timezone);
        var options = {
            tz: timezone
        }
        var interval = parser.parseExpression(cronDate, options);
        var expected = true;
        // Note: cron-parse has a data type of CronDate.
        // This data type pretty much acts as a wrapper
        // for the moment-timezone Interface. Since the wrapper
        // doesn't expose the moment-timezone instance
        // we take the ISOString to construct a new moment object
        // that we use for comparison
        var cronMomentDate = interval.next().toISOString();
        var newMoment = moment(cronMomentDate);
        var actual = now.isBefore(newMoment);
        expect(actual).to.equal(expected);
    })

    it('Store all events passed in the last 3 hours for "Stretch and get water"', () => {
        var cronDate = "0 6-22 * * *";
        var timezone = moment.tz.guess();
        // On first load, the endDate is the current time
        var endDate = moment.tz("2019-01-13 18:55", timezone).toDate();
        // startDate 3 hours ahead of end date
        var startDate = moment.tz("2019-01-13 18:55", timezone).subtract(3, 'hours').toDate();
        // Sun Jan 13 2019 18:46:15 GMT-0500 (Eastern Standard Time)
        var options = {
            currentDate: startDate,
            endDate: endDate,
            tz: timezone
        }
        var interval = parser.parseExpression(cronDate, options);
        var dates = interval.iterate(10);
        expect(dates.length).to.equal(3);
    })

    it('Ensure events "Stretch and get water" and "Water Sunny the Succulent" are stored', () => {
        var cronDate = "0 6-22 * * *";
        var sunnyDate2 = "30 7 * * 1";
        var timezone = moment.tz.guess();
        // On first load, the endDate is the current time
        var endDate = moment.tz("2019-01-14 08:55", timezone);
        // startDate 3 hours ahead of end date
        var startDate = moment.tz("2019-01-14 08:55", timezone).subtract(3, 'hours');
        // Sun Jan 13 2019 18:46:15 GMT-0500 (Eastern Standard Time)
        var options = {
            currentDate: startDate,
            endDate: endDate,
            tz: timezone
        }
        var interval = parser.parseExpression(cronDate, options);
        var sunnyInterval = parser.parseExpression(sunnyDate2, options);
        var dates = interval.iterate(10);
        var sunnyDates = sunnyInterval.iterate(10);
        expect(dates.length + sunnyDates.length).to.equal(4);
    })
})

describe('EventList Tests', () => {

    it('Create eventlist', () => {

        let wrapper = shallowMount(EventList, {
            propsData: {
                eventArray: mockResponse.data
            }
        });
        expect(wrapper).to.not.be.null;
    });

    it('Cron Array initialized with events', () => {
        let wrapper = shallowMount(EventList, {
            propsData: {
                eventArray: mockResponse.data
            }
        });
        
        expect(wrapper.vm.$data.cronArray.length).to.equal(7);
    });

    it('Test to ensure that we populate all events in the last three hours', () => {
        // Note: In order to isolate this single unit of code to test
        // we have to mock out method invocations within the created hook
        // and initializelist method to ensure no unintended side effects
        let wrapper = shallowMount(EventList, {
            propsData: {
                eventArray: mockResponse.data
            },
            methods: {
                // Stub methods in or invoked by other methods
                // in created lifecycle hook
                setEventCheckTimeIntervals: () => {},
                createCronArray: () => {},
                populateNextDay: () => {},
                // Stub watcher methods for given data properties
                checkForEventsToPop: () => {},
                checkForEventsToNotify: () => {}
            },
            data: () => {
                return {
                    now: moment.tz("2019-01-14 08:55", moment.tz.guess()),
                    threeHoursPastNow: moment.tz("2019-01-14 08:55", moment.tz.guess()).subtract(3, 'hours')
                }
            }
        });
        
        // Based on our testing with the library in the unit tests above
        expect(wrapper.vm.$data.displayedEvents.length).to.be.greaterThan(3);
    });

    it('Test to ensure that we populate all events in the next 24 hours', () => {
        // Note: In order to isolate this single unit of code to test
        // we mock out method invocations within the created hook
        // and initializelist method to ensure no unintended side effects
        let wrapper = shallowMount(EventList, {
            propsData: {
                eventArray: mockResponse.data
            },
            methods: {
                setEventCheckTimeIntervals: () => {},
                createCronArray: () => {},
                populateLastThreeHours: () => {}
            },
            data: () => {
                    return { 
                        now: moment.tz("2019-01-14 08:55", moment.tz.guess()),
                        oneDayBeforeNow: moment.tz("2019-01-14 08:55", moment.tz.guess()).add(24, 'hours')
                }
            }
        });
        expect(wrapper.vm.$data.displayedEvents.length).to.equal(19);
    });

    it('Ensure displayed list is the sum of the past 3 hours and next 24', () => {
        // Note: In order to isolate this single unit of code to test
        // we have to mock out method invocations within the created hook
        // and initializelist method to ensure no unintended side effects
        let wrapper = shallowMount(EventList, {
            propsData: {
                eventArray: mockResponse.data
            },
            methods: {
                setEventCheckTimeIntervals: () => {},
                createCronArray: () => {}
            },
            data:() => {
                return { 
                    now: moment.tz("2019-01-14 08:55", moment.tz.guess()),
                    threeHoursPastNow: moment.tz("2019-01-14 08:55", moment.tz.guess()).subtract(3, 'hours'),
                    oneDayBeforeNow: moment.tz("2019-01-14 08:55", moment.tz.guess()).add(24, 'hours')
                }
            }
        });
        expect(wrapper.vm.$data.displayedEvents.length).to.equal(24);
    });

    it('Ensure displayed list is the sum of the past 3 hours and next 24', () => {
        // Note: In order to isolate this single unit of code to test
        // we have to mock out method invocations within the created hook
        // and initializelist method to ensure no unintended side effects
        let wrapper = shallowMount(EventList, {
            propsData: {
                eventArray: mockResponse.data
            },
            methods: {
                setEventCheckTimeIntervals: () => {},
                createCronArray: () => {}
            },
            data:() => {
                return { 
                    now: moment.tz("2019-01-14 08:55", moment.tz.guess()),
                    threeHoursPastNow: moment.tz("2019-01-14 08:55", moment.tz.guess()).subtract(3, 'hours'),
                    oneDayBeforeNow: moment.tz("2019-01-14 08:55", moment.tz.guess()).add(24, 'hours')
                }
            }
        });
        expect(wrapper.vm.$data.displayedEvents.length).to.equal(24);
    });

})