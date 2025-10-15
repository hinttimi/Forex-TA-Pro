import { EconomicEvent } from '../types';

// Helper function to get a future date, avoiding weekends
const getNextBusinessDay = (date: Date): Date => {
    const day = date.getDay();
    if (day === 6) { // Saturday
        date.setDate(date.getDate() + 2);
    } else if (day === 0) { // Sunday
        date.setDate(date.getDate() + 1);
    }
    return date;
};

const getFutureEventDate = (dayOffset: number, hour: number, minute: number): Date => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + dayOffset);
    date.setUTCHours(hour, minute, 0, 0);
    return getNextBusinessDay(date);
};

// The .sort() method was preventing TypeScript's contextual typing from being applied to the array literal,
// causing an error with the 'impact' property.
// By defining the array first and then sorting it, we ensure correct type checking.
const events: EconomicEvent[] = [
    {
        id: 'usd-cpi',
        name: 'Consumer Price Index (CPI) m/m',
        currency: 'USD',
        impact: 'High',
        time: getFutureEventDate(1, 12, 30),
        forecast: '0.4%',
        previous: '0.3%',
        actual: '0.6%', // Pre-filled for demo purposes
    },
    {
        id: 'eur-rates',
        name: 'Main Refinancing Rate',
        currency: 'EUR',
        impact: 'High',
        time: getFutureEventDate(2, 11, 45),
        forecast: '4.50%',
        previous: '4.50%',
        actual: '4.50%',
    },
    {
        id: 'gbp-retail',
        name: 'Retail Sales m/m',
        currency: 'GBP',
        impact: 'Medium',
        time: getFutureEventDate(3, 6, 0),
        forecast: '0.5%',
        previous: '-0.3%',
        actual: '0.7%',
    },
     {
        id: 'usd-nfp',
        name: 'Non-Farm Employment Change',
        currency: 'USD',
        impact: 'High',
        time: getFutureEventDate(5, 12, 30),
        forecast: '185K',
        previous: '212K',
        actual: '155K',
    },
     {
        id: 'cad-unemployment',
        name: 'Unemployment Rate',
        currency: 'CAD',
        impact: 'High',
        time: getFutureEventDate(5, 12, 30),
        forecast: '5.9%',
        previous: '5.8%',
        actual: '6.1%',
    },
    {
        id: 'aud-rates',
        name: 'RBA Cash Rate Statement',
        currency: 'AUD',
        impact: 'High',
        time: getFutureEventDate(8, 3, 30),
        forecast: '4.35%',
        previous: '4.35%',
        actual: '4.35%',
    },
];

events.sort((a, b) => a.time.getTime() - b.time.getTime());

export const CALENDAR_EVENTS = events;