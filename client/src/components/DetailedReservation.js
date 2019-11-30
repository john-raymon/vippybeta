import React, { Component } from "react";
import Modal from "react-modal";
import ListingImagesHeader from "./ListingImagesHeader";
import ListingLineItem from "./ListingLineItem";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.50)"
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "0px",
    border: "none",
    borderRadius: "0"
  }
};
Modal.setAppElement("#root"); // (http://reactcommunity.org/react-modal/accessibility/)
export default class DetailedReservation extends Component {
  constructor(props) {
    super(props);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.sendVerificationCode = this.sendVerificationCode.bind(this);
    this.state = {
      thankYou: false,
      error: null,
      reservation: null,
      isModalOpen: false
    };
  }
  componentDidMount() {
    const {
      location: { parsedSearch },
      userAgent
    } = this.props;
    this.setState({
      thankYou: !!parsedSearch.thankYou
    });
    // fetch reservation from server
    this.props.userAgent
      ._get(`api/reservation/${this.props.match.params.reservationId}`)
      .then(resp => {
        this.setState({
          reservation: resp.reservation,
          error: null
        });
      })
      .catch(error => {
        this.setState({
          error:
            (error.response.body && error.response.body.message) ||
            "Sorry, we could not load the reservation right now. Please refresh the page and try again."
        });
      });
  }
  openModal() {
    this.setState({
      isModalOpen: true
    });
  }
  closeModal() {
    this.setState({
      isModalOpen: false
    });
  }
  sendVerificationCode() {
    this.setState({
      sendingVerificationCode: true
    });
    this.props.userAgent
      ._post(`api/reservation/${this.state.reservation.id}/redeem`)
      .then(resp => {
        this.closeModal();
      })
      .catch(error => {
        this.setState({
          error:
            (error.response.body && error.response.body.message) ||
            "Sorry, we could not load the reservation right now. Please refresh the page and try again."
        });
      })
      .finally(() => {
        this.setState({
          sendingVerificationCode: false
        });
      });
  }
  render() {
    const { reservation, thankYou, isModalOpen, error } = this.state;
    console.log("the reservation is", reservation);
    if (error) {
      return <p className="michroma f8 lh-copy tracked white tc">{error}</p>;
    }
    if (reservation) {
      return (
        <div className="flex flex-column mw8 center pv4">
          <ListingImagesHeader listingImages={reservation.listing.images} />
          <div className="w-100">
            <p className="michroma tracked lh-title white f3 pv3 tc">
              {thankYou
                ? `Thank you for reserving @${
                    reservation.listing.event.host.venueName
                  }!`
                : `You're reserved @${
                    reservation.listing.event.host.venueName
                  }`}
            </p>
          </div>
          <div className="flex flex-column flex-row-l">
            <div className="w-100 w-50-l order-1-l ph1-l">
              <div className="flex flex-row w-100 justify-between pa3">
                {reservation.redeemed ? (
                  <p className="ba b--green michroma tracked-1 f8 tc pv2 w-100 lh-title green ttu">
                    redeemed
                  </p>
                ) : (
                  <button
                    className="vippyButton self-start dim"
                    onClick={this.openModal}
                  >
                    <div className="vippyButton__innerColorBlock">
                      <div className="w-100 h-100 flex flex-column justify-center">
                        <p className="michroma tracked-1 b ttu lh-extra white-90 center pb1 w-100">
                          Redeem at Door
                        </p>
                      </div>
                    </div>
                  </button>
                )}
                <Modal isOpen={isModalOpen} style={customStyles}>
                  <div className="flex flex-column justify-center bg-black pa4 mw6">
                    <p className="michroma f7 tracked lh-copy white tc mb3">
                      Each verification code is valid for 10 minutes. Subsequent
                      request before the code has expired will send the same
                      verification code.
                    </p>
                    <button
                      onClick={this.sendVerificationCode}
                      className="bg-vippy-1 bn white michroma f7 lh-title tracked pv2 pointer dim"
                    >
                      Send Code to {reservation.customer.phonenumber}
                    </button>
                    <button
                      onClick={this.closeModal}
                      className="bg-red bn white michroma f7 lh-title tracked pv2 pointer dim"
                    >
                      Cancel
                    </button>
                  </div>
                </Modal>
              </div>
              <div className="flex flex-column w-100 bg-vippy-1 justify-between pa3 ml1-l">
                <p className="michroma f5 white lh-title tracked tl">
                  How to redeem your reservation at the door
                </p>
                <ul className="michroma f8 white lh-copy tracked tl mt2">
                  <li className="mv2">
                    1. Click{" "}
                    <span className="vippy-yellow">"Redeem at Door"</span>, in
                    order to receive a four digit code to your phone number,{" "}
                    <span className="vippy-yellow">
                      {reservation.customer.phonenumber}
                    </span>
                    .
                  </li>
                  <li className="mv2">
                    2. Provide the four digit code at the door, to a promoter or
                    host, who will then redeem your reservation, and let you in!
                  </li>
                </ul>
              </div>
            </div>
            <div className="w-100 w-50-l pt3">
              <ListingLineItem
                boxTitle={`Confirmation #${reservation.confirmationCode}`}
                listing={reservation.listing}
                userAgent={this.props.userAgent}
              />
            </div>
          </div>
        </div>
      );
    }
    return <div>Loading</div>;
  }
}
