//testOne.spec.js
import { shallowMount } from '@vue/test-utils'
import { expect } from 'chai'
import parser from 'cron-parser'
import moment from 'moment-timezone'
import Scheduler from '../src/components/Scheduler.vue'
const mockResponse = require('../resources/eventResponse.json');

describe('Scheduler.vue',function(){
    
    it('Checking <h2> tag text',function(){
        const wrapper = shallowMount(Scheduler);
        const h2= wrapper.find('h2');
        expect(h2.text()).to.equal('Your Events')
    })

    it('Ensure we can retrieve data from mock response', function() {
        var arr = mockResponse.data;
        expect(arr[0].id).to.equal('0');
    })

    it('Verify reset works how I think it will work', function() {
        var cronDate = "0 7 14 3 *";
        var timezone = moment.tz.guess();
        var options = {
            tz: timezone
        }
        var interval = parser.parseExpression(cronDate, options);
        interval.next().toString();
        interval.next().toString();
        interval.next().toString();
        interval.next().toString();
        interval.reset();
        expect(interval.next().toString()).to.equal('Thu Mar 14 2019 07:00:00 GMT-0400');
    })

})