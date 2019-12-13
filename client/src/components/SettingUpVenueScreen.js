import React, { Component } from "react";

export default class SettingUpVenueScreen extends Component {
  constructor(props) {
    super(props);
    this.loadingScreenMinSeconds = 5000;
  }
  componentDidMount() {
    const { location, history, venueAgent } = this.props;
    const { state: locationState } = location;
    let exceededMinLifetime = false;
    let secondsPassed = 0;
    const lifetimeTimeout = setTimeout(() => {
      exceededMinLifetime = true;
    }, this.loadingScreenMinSeconds);
    const secondsInterval = setInterval(() => {
      secondsPassed = secondsPassed + 1000;
    }, 1000);
    venueAgent
      .completeStripeFlow(`${location.pathname}${location.search}`)
      .then(resp => {
        clearInterval(secondsInterval);
        clearTimeout(lifetimeTimeout);
        if (exceededMinLifetime) {
          if (locationState) {
            return history.replace(locationState.from);
          } else {
            return history.replace("/dashboard");
          }
        } else {
          setTimeout(() => {
            if (locationState) {
              return history.replace(locationState.from);
            } else {
              return history.replace("/dashboard");
            }
          }, this.loadingScreenMinSeconds - secondsPassed);
        }
      })
      .catch(error => {
        console.log("there was an issue with setting up your account", error);
        // TODO: do something here, either retry, log it, and redirect to dashboard to allow user
        // to retry manually
      });
  }
  render() {
    return (
      <div className="tw-flex tw-self-center tw-mx-auto">
        <p className="michroma tw-text-md tracked tw-text-center tw-text-white tw--mt-56">
          Setting up your Vippy account...
          <br />
          <br />
          One moment
        </p>
      </div>
    );
  }
}
