import React, { Component, Fragment } from "react";
import ListingLineItem from "./ListingLineItem";
import ReservationForm from "./ReservationForm";
import { Elements, StripeProvider } from "react-stripe-elements";

export default class Checkout extends Component {
  constructor(props) {
    super(props);
    this.handleReservationFormSubmit = this.handleReservationFormSubmit.bind(
      this
    );
    this.state = {
      listing: null,
      error: null,
      formError: null,
      loading: false
    };
  }
  componentDidMount() {
    if (
      this.props.location.state &&
      this.props.location.state.continueCheckout
    ) {
      this.props.userAgent
        ._get(`api/listing/${this.props.location.state.listingId}`)
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
    } else {
      return this.props.history.push({
        pathname: "/"
      });
    }
  }
  handleReservationFormSubmit(stripeObject) {
    const {
      listing: { id: listingId }
    } = this.state;
    // attempt to validate, and get token then worry about checking authentication.
    this.setState({
      formError: null
    });
    stripeObject.createToken().then(res => {
      if (res.error) {
        return this.setState({
          formError: res.error,
          loading: false
        });
      }
      if (res.token) {
        // TODO: add cardToken to request body, server currently accepts this request and successfully creates reservation without it only if NODE_ENV isn't set to production
        // but this should by default submit the cardToken regardless of it being dev. The reason for the endpoint allowing DEV mode to allow bypass is for
        // hitting endpoint with curl and postmates without having to create a token with stripe.
        this.props.userAgent
          ._post(`api/reservation?listing=${listingId}`, {
            cardToken: res.token
          })
          .then(res => {
            this.setState({
              loading: false
            });
            this.props.history.replace(
              `/reservations/${res.reservation.id}?thankYou=true`
            );
          })
          .catch(error => {
            this.setState({
              loading: false,
              formError:
                "We could not process your payment right now, please try again later or choose a different card."
            });
          });
      }
    });
  }
  render() {
    const { listing, formError } = this.state;
    const { userAgent } = this.props;
    console.log("the error", formError);
    if (listing) {
      return (
        <StripeProvider apiKey="pk_test_2Txz4BEB02STeZraf70NgKYh">
          <div className="flex flex-column mw8 center">
            <h1 className="michroma white tracked lh-copy mb4">Checkout</h1>
            <div className="flex flex-column flex-row-l">
              <div className="w-100 w-50-l">
                {listing && (
                  <ListingLineItem
                    boxTitle="You're almost done! Read the details of your reservation below."
                    listing={listing}
                    userAgent={userAgent}
                  />
                )}
              </div>
              <div className="flex flex-column w-100 w-50-l">
                <div className="ReservationForm__container flex flex-column justify-center flex-grow-1 w-100 mv2 mh2-l mv0-l br2 bg-black">
                  <Elements>
                    <ReservationForm
                      formError={formError}
                      handleSubmit={this.handleReservationFormSubmit}
                      guestCount={listing.guestCount}
                      bookingPrice={listing.bookingPrice}
                      disclaimers={listing.disclaimers}
                      cardElementWrapperWidthClass="w-100"
                      disclaimersWrapperWidthClass="w-100"
                      cardElementParentContainerClasses="flex flex-column w-90"
                    />
                  </Elements>
                </div>
              </div>
            </div>
          </div>
        </StripeProvider>
      );
    }
    return <p className="white"> Loading Checkout ... </p>;
  }
}
