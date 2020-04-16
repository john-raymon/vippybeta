import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { Link, Route } from "react-router-dom";
import { ReservationCard, ListingCard } from "./Cards";
import CreateEvent from "./CreateEvent";
import CreateListing from "./CreateListing";

import { formatEventDate, formatEventTimes } from "./../utils/dateFns";

// Redux Actions
import {
  fetchReservationsForUser,
  fetchReservationsForVenue,
  fetchEventsForVenue,
  fetchListingsForVenue
} from "./../state/actions/authActions";

// Selectors
import getUsersReservation from "./../state/selectors/getUsersReservations";
import getVenueReservations from "./../state/selectors/getVenueReservations";
import getVenueEvents from "./../state/selectors/getVenueEvents";
import getVenueListings from "./../state/selectors/getVenueListings";

function getVenueDashboardCard(type) {
  if (type === "reservation") {
    return function ReservationDashboardCard({
      eventStartTime,
      eventEndTime,
      eventTitle,
      redeemed,
      customerFullName,
      customerPhoneNumber,
      totalPrice,
      reservationId
    }) {
      const { startTime, endTime } = formatEventTimes(
        eventStartTime,
        eventEndTime
      );
      const eventStartDate = formatEventDate(eventStartTime);
      return (
        <div className="tw-flex tw-flex-col tw-ftw-bg-black tw-w-full tw-rounded-md tw-border tw-border-gray-800 tw-rounded-lg tw-my-6 tw-p-4">
          <div className="tw-flex">
            <p className="small-text tw-text-yellow-500 tw-uppercase">
              {eventStartDate}
            </p>
          </div>
          <div className="tw-flex tw-justify-between tw-flex-wrap tw-py-4">
            <div>
              <p className="large-text tw-text-white tw-mb-2 tw-uppercase">
                {customerFullName}
              </p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-border-t tw-border-gray-800 tw-pt-1">
                customer's full name
              </p>
            </div>

            <div>
              <p className="large-text tw-text-white tw-mb-2 tw-uppercase tw-text-right">
                {customerPhoneNumber}
              </p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-text-right tw-border-t tw-border-gray-800 tw-pt-1">
                customer's phone number
              </p>
            </div>

            <div>
              <p className="large-text tw-text-white tw-mb-2">${totalPrice}</p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-text-right tw-border-t tw-border-gray-800 tw-pt-1">
                price
              </p>
            </div>
          </div>
          <div className="tw-flex tw-w-full tw-justify-between tw-pt-2 md:tw-pt-0">
            <div className="tw-flex tw-items-end">
              <p className="small-text tw-text-yellow-500 tw-uppercase">
                {type}
              </p>
            </div>
            <div>
              {redeemed ? (
                <a className="small-text tw-text-gray-400 tw-w-1/2 tw-max-w-sm h-full tw-border tw-border-gray-600 tw-py-1 tw-px-2 tw-ml-2 tw-rounded">
                  redeemed
                </a>
              ) : (
                <a className="small-text tw-text-white tw-w-1/2 tw-max-w-sm h-full tw-bg-green-700 tw-py-1 tw-px-2 tw-ml-2 tw-rounded">
                  redeem
                </a>
              )}
              <Link
                to={`/reservations/${reservationId}`}
                className="small-text tw-text-white tw-w-1/2 tw-max-w-sm h-full tw-bg-green-700 tw-py-1 tw-px-2 tw-ml-2 tw-rounded"
              >
                open/manage
              </Link>
            </div>
          </div>
        </div>
      );
    };
  }
  if (type === "listing") {
    return function ListingCard({
      listingId,
      eventTitle,
      listingTitle,
      eventStartTime,
      eventEndTime,
      customerFullName,
      customerPhoneNumber,
      cancelled,
      guestCount,
      bookingPrice,
      allReservations,
      quantity,
      bookingDeadline
    }) {
      const { startTime, endTime } = formatEventTimes(
        eventStartTime,
        eventEndTime
      );
      const eventStartDate = formatEventDate(eventStartTime);
      const bookingDeadlineDate = formatEventDate(bookingDeadline);
      return (
        <div className="tw-flex tw-flex-col tw-ftw-bg-black tw-w-full tw-rounded-md tw-border tw-border-gray-800 tw-rounded-lg tw-my-6 tw-p-4">
          <div className="tw-flex tw-justify-between tw-pb-4">
            <p className="small-text tw-text-yellow-500 tw-uppercase">
              {eventStartDate}
            </p>

            <p className="small-text tw-text-red-500 tw-text-right tw-uppercase">
              Booking Deadline: {bookingDeadlineDate}
            </p>
          </div>

          <div className="tw-flex tw-flex-wrap md:tw-flex-no-wrap tw-justify-between tw-py-4 tw--m-2">
            <div className="tw-flex tw-w-full md:tw-w-1/4 tw-flex-col tw-w-1/3 tw-m-2 tw-items-center tw-justify-center tw-flex-grow">
              <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-8 tw-overflow-scroll">
                {listingTitle}
              </p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                Listing Name
              </p>
            </div>

            <div className="tw-flex tw-w-full md:tw-w-1/4 tw-m-2 tw-flex-grow">
              <div className="tw-flex tw-flex-col tw-w-1/2 tw-items-center tw-justify-center tw-flex-grow">
                <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-8 tw-overflow-scroll">
                  {guestCount}
                </p>
                <p className="small-text tw-uppercase tw-text-gray-600 tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                  allowed guest count
                </p>
              </div>
              <div className="tw-flex tw-flex-col tw-w-1/2 tw-items-center tw-justify-center tw-flex-grow">
                <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-8 tw-overflow-scroll tw-text-center">
                  {bookingPrice}
                </p>
                <p className="small-text tw-uppercase tw-text-gray-600 tw-text-center tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                  booking price
                </p>
              </div>
            </div>

            <div className="tw-flex tw-flex-col tw-w-full md:tw-w-1/4 tw-m-2 tw-items-center tw-justify-center tw-flex-grow">
              <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-8 tw-overflow-scroll tw-text-right">
                {allReservations.length}
              </p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-text-right tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                reservations
              </p>
            </div>

            <div className="tw-flex tw-flex-col tw-w-full md:tw-w-1/4 tw-m-2 tw-items-center tw-justify-center tw-flex-grow">
              <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-8 tw-overflow-scroll tw-text-right">
                {quantity}
              </p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-text-right tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                quantity
              </p>
            </div>
          </div>

          <div className="tw-flex tw-w-full tw-justify-between tw-pt-2 md:tw-pt-0">
            <div className="tw-flex tw-items-end">
              <p className="small-text tw-text-yellow-500 tw-uppercase">
                {type}
              </p>
            </div>
            <div>
              <Link
                to={`/listing/${listingId}`}
                className="small-text tw-text-white tw-w-1/2 tw-max-w-sm h-full tw-bg-green-700 tw-py-1 tw-px-2 tw-ml-2 tw-rounded"
              >
                open/edit
              </Link>
            </div>
          </div>
        </div>
      );
    };
  }
  if (type === "event") {
    return function EventCard({
      eventId,
      eventTitle,
      eventStartTime,
      eventEndTime,
      cancelled,
      totalReservations,
      totalListingQuantityLeft,
      endTimeStillInFuture = true
    }) {
      const { startTime, endTime } = formatEventTimes(
        eventStartTime,
        eventEndTime
      );
      const eventStartDate = formatEventDate(eventStartTime);
      return (
        <div className="tw-flex tw-flex-col tw-ftw-bg-black tw-w-full tw-rounded-md tw-border tw-border-gray-800 tw-rounded-lg tw-my-6 tw-p-4">
          <div className="tw-flex">
            <p className="small-text tw-text-yellow-500 tw-uppercase">
              {eventStartDate}
            </p>
          </div>
          <div className="tw-flex tw-flex-wrap md:tw-flex-no-wrap tw-justify-between tw-py-4 tw--m-2">
            <div className="tw-flex tw-w-full md:tw-w-1/3 tw-flex-col tw-w-1/3 tw-m-2 tw-items-center tw-justify-center tw-flex-grow">
              <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-auto tw-overflow-visible">
                {eventTitle}
              </p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                Event Title
              </p>
            </div>

            <div className="tw-flex tw-w-full md:tw-w-1/3 tw-m-2 tw-flex-grow">
              <div className="tw-flex tw-flex-col tw-w-1/2 tw-items-center tw-justify-center tw-flex-grow">
                <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-8 tw-overflow-scroll">
                  {`${totalReservations} reservation${
                    totalReservations > 1 || totalReservations === 0 ? "s" : ""
                  }`}
                </p>
                <p className="small-text tw-uppercase tw-text-gray-600 tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                  reservations made
                </p>
              </div>
            </div>

            <div className="tw-flex tw-flex-col tw-w-full md:tw-w-1/3 tw-m-2 tw-items-center tw-justify-center tw-flex-grow">
              <p className="large-text tw-text-white tw-uppercase tw-w-full tw-h-8 tw-overflow-scroll tw-text-right">
                {`${startTime} - ${endTime}`}
              </p>
              <p className="small-text tw-uppercase tw-text-gray-600 tw-text-right tw-border-t tw-border-gray-800 tw-w-full tw-flex-grow tw-py-2">
                start time - end time
              </p>
            </div>
          </div>
          <div className="tw-flex tw-w-full tw-justify-between tw-pt-2 md:tw-pt-0">
            <div className="tw-flex tw-items-end">
              <p className="small-text tw-text-yellow-500 tw-uppercase">
                {type}
              </p>
            </div>
            <div>
              {(endTimeStillInFuture || "") && (
                <Link
                  to={`/dashboard/create-listings/${eventId}`}
                  className="small-text tw-text-white tw-w-1/2 tw-max-w-sm h-full tw-bg-green-700 tw-py-1 tw-px-2 tw-ml-2 tw-rounded"
                >
                  add vip/packages
                </Link>
              )}
              <Link
                to={`/events/${eventId}`}
                className="small-text tw-text-white tw-w-1/2 tw-max-w-sm h-full tw-bg-green-700 tw-py-1 tw-px-2 tw-ml-2 tw-rounded"
              >
                open/edit
              </Link>
            </div>
          </div>
        </div>
      );
    };
  }
}

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "events"
    };
  }
  componentDidMount() {
    // fetch reservation
    if (this.props.isVenueAuth) {
      this.props.fetchEventsForVenueDispatch(
        this.props.venueAgent,
        this.props.venue.venueId
      );
      this.props.fetchReservationsForVenueDispatch(this.props.venueAgent);
      this.props.fetchListingsForVenueDispatch(
        this.props.venueAgent,
        this.props.venue.venueId
      );
      return;
    }
    // by default fetch reservations assuming a regular user is authenticated
    this.props.fetchReservationsForUserDispatch(this.props.userAgent);
  }

  render() {
    if (this.props.isVenueAuth) {
      const allReservations = this.props.venuesData.reservations.map(
        reservation => {
          let VenueReservationCard = getVenueDashboardCard("reservation");
          return (
            <VenueReservationCard
              key={reservation.id}
              eventTitle={reservation.listing.event.name}
              eventStartTime={reservation.listing.event.startTime}
              eventEndTime={reservation.listing.event.endTime}
              redeemed={reservation.listing.redeemed}
              customerFullName={reservation.customer.fullname}
              customerPhoneNumber={reservation.customer.phonenumber}
              totalPrice={reservation.listing.bookingPrice}
              reservationId={reservation.id}
            />
          );
        }
      );

      const allEvents = this.props.venuesData.events.map(event => {
        let EventCard = getVenueDashboardCard("event");
        return (
          <EventCard
            eventId={event.id}
            eventTitle={event.name}
            eventStartTime={event.startTime}
            eventEndTime={event.endTime}
            cancelled={event.cancelled}
            totalReservations={event.totalReservations}
          />
        );
      });

      const allListings = this.props.venuesData.listings.map(listing => {
        let ListingCard = getVenueDashboardCard("listing");
        return (
          <ListingCard
            listingId={listing.id}
            eventTitle={listing.event.name}
            listingTitle={listing.name}
            eventStartTime={listing.event.startTime}
            eventEndTime={listing.event.endTime}
            cancelled={listing.event.cancelled}
            guestCount={listing.guestCount}
            bookingPrice={listing.bookingPrice}
            allReservations={listing.currentReservations}
            quantity={
              listing.unlimitedQuantity ? "unlimited" : listing.quantity
            }
            bookingDeadline={listing.bookingDeadline}
          />
        );
      });

      const allTabs = ["reservations", "listings", "events"];
      return (
        <div className="venue-dashboard venue-dashboard__container">
          <Route
            path={`${this.props.match.path}/create-event`}
            render={props => {
              return (
                <CreateEvent
                  {...props}
                  venue={this.props.venue}
                  venueAgent={this.props.venueAgent}
                />
              );
            }}
          />
          <Route
            path={`${this.props.match.path}/create-listings/:eventId?/:new?`}
            render={props => {
              return (
                <CreateListing
                  {...props}
                  venue={this.props.venue}
                  venueAgent={this.props.venueAgent}
                />
              );
            }}
          />
          <section className="venue-dashboard__header-section tw-flex tw-flex-wrap tw-justify-between tw-items-center">
            <div className="venue-dashboard__header-section__left tw-w-full md:tw-w-1/2">
              <div className="tw-flex tw-flex-row tw-items-center">
                {Object.entries(this.props.venue.images).length ? (
                  <img
                    className="venue-dashboard__image tw-w-20 tw-h-20 tw-rounded-full tw-bg-purple-200"
                    src="/"
                  />
                ) : (
                  <div className="tw-w-20">
                    <div className="venue-dashboard__image--fallback tw-w-full tw-pb-1/1 tw-rounded-full tw-bg-purple-200" />
                  </div>
                )}
                <div className="tw-ml-2 tw-p-2 tw-text-gray-500">
                  <p className="tw-font-mich tw-text-2xs tw-uppercase tw-tracking-widest tw-my-2">
                    {this.props.venue.venueName} /{" "}
                    {this.props.venue.legalVenueName}
                  </p>
                  {!this.props.venue.venueAddress && (
                    <div>
                      <p className="tw-font-mich tw-text-2xs tw-uppercase tw-tracking-widest tw-my-1">
                        335 N Magnolia ave
                      </p>
                      <p className="tw-font-mich tw-text-2xs tw-uppercase tw-tracking-widest tw-my-1">
                        Orlando, FL 32801
                      </p>
                    </div>
                  )}
                  <div>
                    <a className="tw-block tw-font-mich tw-text-2xs tw-uppercase tw-tracking-widest tw-my-2 tw-text-green-500 tw-underline tw-leading-loose">
                      edit account
                    </a>
                    <button
                      onClick={() =>
                        this.props.venueAgent.redirectToStripeDashboard({
                          account: "true"
                        })
                      }
                      className="tw-cursor-pointer tw-block tw-font-mich tw-text-2xs tw-uppercase tw-tracking-widest tw-my-2 tw-text-green-500 tw-underline tw-leading-loose"
                    >
                      go to stripe account
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="venue-dashboard__header-section__right tw-w-full md:tw-w-1/2 tw-flex tw-flex-col tw-items-end md:tw-pl-4">
              <Link
                to={`${this.props.match.url}/create-event`}
                className="button tw-text-center tw-my-2 tw-bg-green-700 tw-px-12 tw-py-3 tw-text-2xs tw-w-full tw-tracking-widest-1 tw-rounded-lg"
              >
                create a new event
              </Link>
              <button className="button tw-my-2 tw-bg-green-700 tw-px-12 tw-py-3 tw-text-2xs tw-w-full tw-tracking-widest-1 tw-rounded-lg">
                pay out now
              </button>
            </div>
          </section>

          <section className="venue-dashboard__balance-section tw-flex tw-flex-col tw-my-6">
            <div className="tw-flex tw-w-full tw-border-b tw-border-gray-700">
              <div className="tw-w-9/12 tw-flex tw-justify-between">
                <div className="tw-pb-2">
                  <p className="tw-mich tw-text-lg tw-text-white tw-mb-2">
                    $4000.00
                  </p>
                  <p className="tw-mich tw-uppercase tw-text-2xs tw-text-gray-400 tw-leading-snug">
                    available
                    <br />
                    balance
                  </p>
                </div>
                <div className="tw-flex tw-items-end">
                  <div className="tw-pb-2">
                    <p className="tw-mich tw-text-lg tw-text-right tw-text-white">
                      $4000.00
                    </p>
                  </div>
                  <span className="tw-border-r tw-border-gray-700 tw-h-1/2 tw-pl-5" />
                </div>
              </div>
              <div className="tw-w-3/12 tw-flex tw-items-end tw-justify-end">
                <div className="tw-pb-2">
                  <p className="tw-mich tw-text-lg tw-text-right tw-text-white">
                    30
                  </p>
                </div>
              </div>
            </div>
            <div className="tw-flex tw-w-full">
              <div className="tw-w-9/12 tw-flex tw-items-start tw-justify-between">
                <div className="tw-pt-2">
                  <p className="tw-mich tw-text-lg tw-text-white tw-mb-2">
                    $4020.00
                  </p>
                  <p className="tw-mich tw-uppercase tw-text-2xs tw-text-gray-400 tw-leading-snug">
                    total balance
                  </p>
                  <a
                    onClick={() =>
                      this.props.venueAgent.redirectToStripeDashboard()
                    }
                    className="tw-cursor-pointer tw-block tw-font-mich tw-text-2xs tw-uppercase tw-tracking-widest tw-my-2 tw-text-green-500 tw-underline tw-leading-loose"
                  >
                    view payouts on stripe
                  </a>
                </div>
                <div className="tw-flex tw-self-stretch tw-items-start">
                  <div className="tw-pt-2">
                    <p className="tw-mich tw-uppercase tw-text-2xs tw-text-right tw-text-gray-400 tw-leading-snug">
                      revenue made
                      <br />
                      this week
                    </p>
                  </div>
                  <span className="tw-border-r tw-border-gray-700 tw-h-5/12 tw-pl-5" />
                </div>
              </div>
              <div className="tw-w-3/12 tw-flex tw-items-start tw-justify-end">
                <div className="tw-pt-2">
                  <p className="tw-mich tw-uppercase tw-text-2xs tw-text-right tw-text-gray-400 tw-leading-snug">
                    reservations sold
                    <br />
                    this week
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="tw-flex tw-flex-col tw-my-6">
            <ul className="tw-flex tw-w-full tw-border-b tw-border-gray-600">
              <li className="tw-flex tw-border-r tw-border-gray-600 tw-pt-2 tw-px-4">
                <a className="small-text tw-uppercase tw-text-yellow-500 tw-pb-2">
                  {this.state.activeTab}
                </a>
              </li>

              {allTabs
                .filter(t => t !== this.state.activeTab)
                .map((t, id) => (
                  <li
                    onClick={() => {
                      this.setState({
                        activeTab: t
                      });
                    }}
                    className="tw-flex tw-border-r tw-border-gray-600 tw-pt-2 tw-px-4"
                  >
                    <a className="small-text tw-text-white tw-uppercase tw-pb-2 tw-cursor-pointer">
                      {t}
                    </a>
                  </li>
                ))}
            </ul>
            {this.state.activeTab === "reservations" && (
              <div className="tw-w-full tw-pt-5">{allReservations}</div>
            )}
            {this.state.activeTab === "events" && (
              <div className="tw-w-full tw-pt-5">{allEvents}</div>
            )}
            {this.state.activeTab === "listings" && (
              <div className="tw-w-full tw-pt-5">{allListings}</div>
            )}
          </section>
        </div>
      );
    }
    const {
      activeReservationsCount,
      pastReservationsCount,
      pastReservations,
      activeReservations
    } = this.props;

    const allActiveReservations = () => {
      if (allActiveReservations) {
        return (
          <Fragment>
            <p className="michroma tw-text-sm tracked lh-extra white-70 tw-py-2 tl no-underline">
              You have {activeReservationsCount} active or upcoming reservation
              {activeReservationsCount > 1 ? `s` : ""}.
            </p>
            <div className="cf w-100">
              {activeReservations.map(({ listing, id }, key) => {
                return (
                  <ReservationCard
                    key={key}
                    reservationId={id}
                    listing={listing}
                    bookingDeadline={listing.bookingDeadline}
                    packageTitle={listing.name}
                    eventStartTime={listing.event.startTime}
                    eventEndTime={listing.event.endTime}
                    venueName={listing.host.venueName}
                    guestCount={listing.guestCount}
                    price={listing.bookingPrice}
                    venueStreetAddress={listing.event.address.street}
                    venueCityZipCode={`${listing.event.address.city},${
                      listing.event.address.state
                    } ${listing.event.address.zip}`}
                    images={listing.images}
                    widthClassName="tw-w-full"
                  />
                );
              })}
            </div>
          </Fragment>
        );
      }
      if (!activeReservationsCount) {
        return (
          <p className="michroma font-base tracked lh-extra white-70 pv2 tl no-underline">
            You have no active/upcoming reservations
          </p>
        );
      }
    };

    const allPastReservations = () => {
      if (pastReservationsCount) {
        return (
          <Fragment>
            <p className="michroma tw-text-sm tracked lh-extra white-70 tw-py-2 tl no-underline">
              You have {pastReservationsCount} past reservation
              {pastReservationsCount > 1 ? `s` : ""}.
            </p>
            <div className="cf w-100">
              {pastReservations.map(({ listing, id }, key) => {
                return (
                  <ReservationCard
                    key={key}
                    listing={listing}
                    reservationId={id}
                    bookingDeadline={listing.bookingDeadline}
                    packageTitle={listing.name}
                    eventStartTime={listing.event.startTime}
                    eventEndTime={listing.event.endTime}
                    venueName={listing.host.venueName}
                    guestCount={listing.guestCount}
                    price={listing.bookingPrice}
                    venueStreetAddress={listing.event.address.street}
                    venueCityZipCode={`${listing.event.address.city},${
                      listing.event.address.state
                    } ${listing.event.address.zip}`}
                    images={listing.images}
                    widthClassName="w-100"
                  />
                );
              })}
            </div>
          </Fragment>
        );
      }
      if (!pastReservationsCount) {
        return (
          <p className="michroma f8 tracked lh-extra white-70 pv2 tl no-underline">
            You have no past reservations.
          </p>
        );
      }
    };

    return (
      <div className="flex flex-column tw-w-full center mw8 pt1">
        <h1 className="michroma tracked lh-title white ttc f3 f2-ns pr4 mb3 mw6 mt1">
          Dashboard
        </h1>
        <div className="mb3">
          <p className="sticky top-from-nav z-1 bg-black michroma f8 tracked-1 ttu lh-title yellow pv2 bb">
            Active/Upcoming Reservations
          </p>
          {allActiveReservations()}
        </div>
        <div className="mb3">
          <p className="sticky top-from-nav z-1 bg-black michroma f8 tracked-1 ttu lh-title yellow pv2 bb">
            Past Reservations
          </p>
          {allPastReservations()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { isVenueAuth } = props;
  // map relevant state to component's props depending on auth. user
  if (isVenueAuth) {
    // use venue related selectors for venue data, props are used for filters
    return {
      venuesData: {
        events: getVenueEvents(state, props),
        reservations: getVenueReservations(state, props),
        listings: getVenueListings(state, props)
      }
    };
  }
  return {
    ...getUsersReservation(state)
  };
};

export default connect(
  mapStateToProps,
  {
    fetchReservationsForUserDispatch: fetchReservationsForUser,
    fetchReservationsForVenueDispatch: fetchReservationsForVenue,
    fetchEventsForVenueDispatch: fetchEventsForVenue,
    fetchListingsForVenueDispatch: fetchListingsForVenue
  }
)(Dashboard);
