import React, { Component } from "react";
import { connect } from "react-redux";
// import { Route } from "react-router";

// redux actions
import { queryByZipCode } from "./../state/actions/queriedActions";

// selectors
import getEventsAndListings from "./../state/selectors/getEventsAndListings";

// mui components
import TextField from "@material-ui/core/TextField";
import BrowseContainer from "./BrowseContainer";

// images
import heroBackgroundImage from "./../images/vippy-hero-background.png";

class Homepage extends Component {
  constructor(props) {
    super(props);
    this.handleZipCodeChange = this.handleZipCodeChange.bind(this);
    this.onZipCodeSearchClick = this.onZipCodeSearchClick.bind(this);
    this.validateSearch = this.validateSearch.bind(this);
    this.state = {
      zipCode: ""
    };
  }

  handleZipCodeChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  validateSearch(zipCode = "") {
    let isError = false;
    if (!zipCode.trim()) {
      isError = true;
    }
    return isError;
  }

  onZipCodeSearchClick() {
    // validate
    const isError = this.validateSearch(this.state.zipCode);
    if (!isError) {
      this.props.queryByZipCode(this.state.zipCode);
    }
  }

  render() {
    const { zipCode } = this.state;
    const {
      isBrowserLoading,
      eventsCount,
      events,
      listingsCount,
      listings,
      browseError
    } = this.props;
    return (
      <div className="homepage flex tw-self-start flex-column mw8 center justify-center pb4">
        <div className="homepage__hero relative flex flex-column">
          <div className="absolute absolute--fill flex flex-column flex-row-l justify-center items-center-l justify-between-l pb5-l">
            <p className="michroma f6 f4-ns tracked b lh-title white-90 pl3 w-80 w-60-ns">
              Book the best vip spot for your night out.
            </p>
            <div className="flex flex-column w-auto mw5 mw6-l self-end self-center-l">
              <div className="w-auto">
                <TextField
                  onChange={this.handleZipCodeChange}
                  value={zipCode}
                  name="zipCode"
                  type="search"
                  label="search by zip code"
                  placeholder="ex. 55333"
                  margin="normal"
                  fullWidth={true}
                  inputProps={{
                    className: "b--white tr w-70 f8-important tracked"
                  }}
                  InputProps={{
                    className:
                      "MuiInputBase-input white-important w-100 tr b--white ttu michroma-important mt2-important tracked MuiInput-underline"
                  }}
                  InputLabelProps={{
                    className:
                      "MuiInputLabel-shrink white-important ttu tr michroma-important f8-important right-0 relative-important lh-small tracked-05"
                  }}
                />
              </div>
              <button
                className="vippyButton mt2 mw1 self-end"
                onClick={this.onZipCodeSearchClick}
              >
                <div className="vippyButton__innerColorBlock">
                  <div className="w-100 h-100 flex flex-column justify-center">
                    <p className="michroma tracked-1 b ttu lh-extra white-90 center pb1">
                      search
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div className="w-100 w-80-m w-60-l">
            <img src={heroBackgroundImage} width="100%" alt="Hero Background" />
          </div>
        </div>
        <div className="flex flex-column mt4 mt5-m">
          <div className="w-100 order-2 order-0-l">
            <div className="sticky top-from-nav mt4 mt0-l w-100 flex flex-column flex-row-m">
              <p className="michroma f4 tracked b lh-copy white-90 pa3 w-70 z-2">
                Know What To Expect Before Going Out by Reserving on Vippy.
                <span className="db lh-copy white f8 pt3">
                  We exclusively partner with venues to bring forth underrated,
                  and reliable experiences.
                  <span className="db f7 white pt1 underline">
                    Learn how it works here.
                  </span>
                </span>
              </p>
              <div className="marketingBox absolute absolute--fill w-100 h-100 z-0">
                <div className="bg-black-70 w-100 h-100" />
                {
                  // <p className="michroma tracked white-30 f9 absolute bottom-0 right-0 pa2">
                  //   Photo by Benjamin Hung on Unsplash
                  // </p>
                }
              </div>
            </div>
          </div>
          <div className="homepage__browseContainerWrapper w-100 flex flex-column">
            <BrowseContainer
              isLoading={isBrowserLoading}
              events={events}
              listings={listings}
              eventsCount={events ? events.length : 0}
              listingsCount={listings ? listings.length : 0}
              error={browseError}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    queried: { isLoading, error }
  } = state;
  const {
    eventsById,
    events,
    listings,
    eventsCount,
    listingsCount
  } = getEventsAndListings(state);
  return {
    isBrowserLoading: isLoading,
    eventsCount,
    events,
    listingsCount,
    listings,
    eventsById,
    browseError: error
  };
};

export default connect(
  mapStateToProps,
  { queryByZipCode }
)(Homepage);
