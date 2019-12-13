import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { ReservationCard, ListingCard } from "./Cards";

// Redux Actions
import { fetchReservationsForUser } from "./../state/actions/authActions";

// Selectors
import getUsersReservation from "./../state/selectors/getUsersReservations";

class Dashboard extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch reservation
    this.props.fetchReservationsForUserDispatch(this.props.userAgent);
  }

  render() {
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

const mapStateToProps = state => {
  return {
    ...getUsersReservation(state)
  };
};

export default connect(
  mapStateToProps,
  { fetchReservationsForUserDispatch: fetchReservationsForUser }
)(Dashboard);
