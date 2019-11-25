import React, { Component, Fragment } from "react";
import { Elements, StripeProvider } from "react-stripe-elements";
import { EventCard } from "./Cards";
import ListingImagesHeader from "./ListingImagesHeader";
import ReservationForm from "./ReservationForm";

// <form className="flex flex-column items-center pv4 w-100">
//   <div className="flex flex-column flex-row-ns w-90">
//     <div className="flex flex-column w-100 w-50-ns">
//       <input className="ReservationForm__input mb3" type="" placeholder="card number" />
//       <div className="flex flex-row flex-wrap">
//         <input className="ReservationForm__input flex flex-grow-1 mb2" type="" placeholder="EXP MM/YY" />
//         <input className="ReservationForm__input flex flex-grow-1 mb2" type="" placeholder="CVC" />
//       </div>
//     </div>
//     <div className="flex flex-column w-100 w-50-ns ph4-ns pt2">
//       <p className="michroma f8 tracked lh-copy white-60 pb2 ttu tj">
//         <span className="db vippy-yellow lh-title pb1">
//           disclaimers
//         </span>
//         {`${listing.disclaimers}`}
//       </p>
//     </div>
//   </div>
// </form>

class DetailedListing extends Component {
  constructor(props) {
    super(props);
    this.handleReservationFormSubmit = this.handleReservationFormSubmit.bind(
      this
    );
    this.state = {
      listing: null,
      error: null,
      formError: null
    };
  }
  componentDidMount() {
    console.log("the new state in location is", this.props.location);
    // if (
    //   this.props.location.state &&
    //   this.props.location.state.continueCheckout
    // ) {
    //   // no need to fetch listing data, as user will be forwarded to dedicated
    //   // checkout container component, which will handle everything with
    //   // stripe token data (this.props.location.state.stripeTokenObject) created from the user's card information and also this listing's id.
    //
    // } else {
    // fetch listing data
    this.props.userAgent
      ._get(`api/listing/${this.props.match.params.listingId}`)
      .then(resp => {
        this.setState({
          listing: resp.listing,
          error: null
        });
      })
      .catch(error => {
        this.setState({
          error: "Sorry, we can't load the listing right now."
        });
      });
  }
  handleReservationFormSubmit(stripeObject) {
    const { isAuth, history, location } = this.props;
    // check if user is authenticated, if not redirect to login remembering to continueCheckout and the listingId of listing attempting to reserve
    if (!isAuth) {
      return history.push({
        pathname: "/login",
        state: {
          from: {
            pathname: "/checkout",
            state: {
              continueCheckout: true,
              listingId: this.props.match.params.listingId
            }
          }
        }
      });
    }
    return history.push({
      pathname: "/checkout",
      state: {
        continueCheckout: true,
        listingId: this.props.match.params.listingId
      }
    });
  }

  render() {
    const { error, listing, formError } = this.state;
    console.log(listing);
    if (error) {
      return <p className="red">{error}</p>;
    }
    if (listing) {
      const { event } = listing;
      return (
        <StripeProvider apiKey="pk_test_2Txz4BEB02STeZraf70NgKYh">
          <Elements>
            <div className="pv4 mw8 center white">
              <ListingImagesHeader listingImages={listing.images} />
              <div className="flex flex-column flex-row-ns w-100 pt2 justify-between">
                <div className="w-100 w-75-l pr2">
                  <h1 className="michroma tracked lh-title ttu">
                    {listing.name}
                  </h1>
                  <p className="michroma f7 tracked lh-copy white-90 mt3 mb4 tl">
                    {listing.description}
                  </p>
                  <p className="michroma f8 tracked lh-copy white-60 pb2 ttu tj">
                    <span className="db vippy-yellow lh-title pb1">
                      disclaimers
                    </span>
                    {`${listing.disclaimers}`}
                  </p>
                  <p className="michroma f5 tracked lh-title yellow pb2 ttu tl">
                    {`$${listing.bookingPrice} / up to ${
                      listing.guestCount
                    } guest`}
                  </p>
                  <div className="flex tw-flex-col lg:tw-flex-row lg:tw-items-center md:tw-mt-10 tw-px-4">
                    <h1 className="michroma tracked lh-title tw-text-base white tw-pb-4 md:tw-pb-0 tw-mr-6">
                      Like this listing ?
                    </h1>
                    <button
                      onClick={this.handleReservationFormSubmit}
                      className="button tw-bg-green-500 tw-px-6"
                    >
                      Reserve Now
                    </button>
                    {/* <ReservationForm
                        handleSubmit={this.handleReservationFormSubmit}
                        formError={formError}
                        guestCount={listing.guestCount}
                        bookingPrice={listing.bookingPrice}
                        disclaimers={listing.disclaimers}
                      /> */}
                  </div>
                </div>

                <div className="w-100 w-25-l pl2">
                  <div>
                    <EventCard
                      eventTitle={event.name}
                      venueInitial={event.host.venueName[0]}
                      eventDate={event.date}
                      eventStartTime={event.startTime}
                      eventEndTime={event.endTime}
                      venueName={event.host.venueName}
                      venueStreetAddress={event.address.street}
                      venueCityZipCode={`${event.address.city},${
                        event.address.state
                      } ${event.address.zip}`}
                      images={event.images}
                      widthClassName="w-100"
                      aspectRatioClass="aspect-ratio--3x4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Elements>
        </StripeProvider>
      );
    }
    return <p className="white">Loading</p>;
  }
}

export default DetailedListing;
