import React, { Component, Fragment } from "react";

// components
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import CircularProgress from "@material-ui/core/CircularProgress";
import { EventCard, ListingCard } from "./Cards";

class BrowseContainer extends Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.state = {
      currentTab: "events",
      tabs: ["events", "vips/packages"]
    };
  }

  handleTabChange(e, value) {
    this.setState({
      ...this.state,
      currentTab: value
    });
  }

  render() {
    const { currentTab, tabs } = this.state;
    const {
      events,
      listings,
      eventsCount,
      listingsCount,
      isLoading
    } = this.props;

    const eventsTabContent = () => {
      if (events !== null && events.length === 0) {
        return (
          <div className="bg-vippy-1 pv2 ph3 pa2-l">
            <a className="michroma f7 tracked lh-extra white-90 pv2 tl no-underline">
              Sorry, there aren't any events nearby right now. You can try a
              different zip code or try again later.
            </a>
          </div>
        );
      }
      return events.map((event, key) => {
        return (
          <EventCard
            key={key}
            eventTitle={event.name}
            venueInitial={event.host.venueName[0]}
            eventDate={event.date}
            eventStartTime={event.startTime}
            eventEndTime={event.endTime}
            venueName={event.host.venueName}
            venueStreetAddress={event.address.street}
            venueCityZipCode={`${event.address.city},${event.address.state} ${
              event.address.zip
            }`}
            images={event.images}
          />
        );
      });
    };

    const listingsTabContent = () => {
      if (events !== null && events.length === 0) {
        return (
          <div className="bg-vippy-1 pv2 ph3 pa2-l">
            <a className="michroma f7 tracked lh-extra white-90 pv2 tl no-underline">
              Sorry, there are't any listings nearby right now, you can try a
              different zipcode.
            </a>
          </div>
        );
      }
      if (listings !== null && listings.length === 0) {
        return (
          <p className="michroma f7 tracked lh-extra bg-vippy-1 white-90 pv2 ph3 tl">
            Sorry there aren't any listings near you right now.
          </p>
        );
      }

      return listings.map((listing, key) => {
        return (
          <ListingCard
            key={key}
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
            widthClassName="w-100 w-50-m w-25-l"
          />
        );
      });
    };

    return (
      <div className="browseContainer w-100 br2 self-end">
        {!listings || !events ? (
          <p className="michroma f7 tracked lh-extra white-90 pv2 ph3 tl">
            Enter your zip code above to browse nearby events and packages/vips.
          </p>
        ) : (
          <Fragment>
            <div className="flex flex-row items-center sticky top-from-nav z-5 bg-vippy-1">
              <Tabs
                value={currentTab}
                onChange={this.handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                className="flex-grow-1 bg-vippy-1"
              >
                {tabs.map((tab, key) => {
                  return (
                    <Tab
                      value={tab}
                      key={key}
                      className="white-important ttu tl michroma-important f8-important lh-small tracked"
                      label={tab}
                      textColor="primary"
                    />
                  );
                })}
              </Tabs>
              {isLoading ? (
                <div className="michroma f8 tracked lh-extra white-70 pv1 ph3 tc tr-m tc-l">
                  <CircularProgress color="primary" size="20px" />
                </div>
              ) : (
                <div className="flex-grow-1 h-100">
                  {currentTab === "events" && (
                    <p className="michroma f8 tracked lh-extra white-70 pv1 ph3 tc tr-ns">
                      {`${eventsCount} nearby`}
                    </p>
                  )}
                  {currentTab === "vips/packages" && (
                    <p className="michroma f8 tracked lh-extra white-70 pv1 ph3 tc tr-ns">
                      {`${listingsCount} nearby`}
                    </p>
                  )}
                </div>
              )}
            </div>
            {currentTab === "events" && (
              <div className="browseContainer__eventsTabContainer cf bg-vippy white">
                {!isLoading && eventsTabContent()}
              </div>
            )}
            {currentTab === "vips/packages" && (
              <div className="browseContainer__listingsTabContainer cf bg-vippy white">
                {!isLoading && listingsTabContent()}
              </div>
            )}
          </Fragment>
        )}
      </div>
    );
  }
}

export default BrowseContainer;
