import { createSelector } from "reselect";
import isFuture from "date-fns/is_future";
// import distanceInWordsToNow from "date-fns/distance_in_words_to_now";

export default createSelector(
  state => {
    const {
      queried: { eventsCount, events, listingsCount, listings }
    } = state;
    return {
      eventsCount,
      events,
      listingsCount,
      listings
    };
  },
  state => {
    const { events, listings } = state;
    const allEvents =
      events &&
      events.filter(event => {
        // console.log('testing end time isfuture',isFuture(new Date(event.endTime)))
        // console.log("distance in words", distanceInWordsToNow(new Date(event.endTime)))
        return (
          !event.cancelled && isFuture(new Date(event.endTime)) && event.host
        );
      });
    const eventsById = events
      ? events.reduce(function(obj, event) {
          obj[event.id] = event;
          return obj;
        }, {})
      : {};

    const allListings =
      listings &&
      listings.filter(
        listing =>
          !listing.cancelled &&
          isFuture(new Date(listing.bookingDeadline)) &&
          isFuture(new Date(listing.event.endTime)) &&
          listing.host
      );

    return {
      ...state,
      events: allEvents,
      eventsById: eventsById,
      listings: allListings
    };
  }
);
