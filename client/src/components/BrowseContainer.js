import React, { Component, Fragment } from "react";

// components
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import CardMedia from "@material-ui/core/CardMedia";
import CardContent from "@material-ui/core/CardContent";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import CircularProgress from "@material-ui/core/CircularProgress";
import { EventCard, ListingCard } from "./Cards";

// images
import eventIcon from "./../images/event-icon.png";

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
          <a
            href={`mailto:?subject=${encodeURIComponent(
              "GetVippy.com City Request"
            )}&body=${encodeURIComponent(
              "Hello, I would love for Vippy to expand near my city ... "
            )}`}
            className="michroma f7 tracked lh-extra white-90 pv2 ph3 tl no-underline"
          >
            Looks like we havn't expanded to your area yet. Try a different zip
            code, or advocate for it by reaching out{" "}
            <span className="underline">here</span>.
          </a>
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
          />
        );
      });
    };

    const listingsTabContent = () => {
      if (events !== null && events.length === 0) {
        return (
          <a
            href={`mailto:?subject=${encodeURIComponent(
              "GetVippy.com City Request"
            )}&body=${encodeURIComponent(
              "Hello, I would love for Vippy to expand near my city ... "
            )}`}
            className="michroma f7 tracked lh-extra white-90 pv2 ph3 tl no-underline"
          >
            Looks like we havn't expanded to your area yet. Try a different zip
            code, or advocate for it by reaching out{" "}
            <span className="underline">here</span>.
          </a>
        );
      }
      if (listings !== null && listings.length === 0) {
        return (
          <p className="michroma f7 tracked lh-extra white-90 pv2 ph3 tl">
            Looks like there aren't any listings near you.
          </p>
        );
      }

      return listings.map((listing, key) => {
        return (
          <ListingCard
            key={key}
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
          />
        );
      });
    };

    return (
      <div className="browseContainer w-100 w-50-l br2 self-end">
        {!listings || !events ? (
          <p className="michroma f7 tracked lh-extra white-90 pv2 ph3 tl">
            Enter your zip code above to browse nearby events and packages/vips.
          </p>
        ) : (
          <Fragment>
            <div className="flex flex-row items-center sticky top-from-nav mb2 z-5 bg-vippy-1">
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
                <p className="michroma f8 tracked lh-extra white-70 pv1 ph3 tc tr-m tc-l">
                  <CircularProgress color="primary" size="20px" />
                </p>
              ) : (
                <div className="flex-grow-1 h-100">
                  {currentTab === "events" && (
                    <p className="michroma f8 tracked lh-extra white-70 pv1 ph3 tc tr-m tc-l">
                      {`${eventsCount} nearby`}
                    </p>
                  )}
                  {currentTab === "vips/packages" && (
                    <p className="michroma f8 tracked lh-extra white-70 pv1 ph3 tc tr-m tc-l">
                      {`${listingsCount} nearby`}
                    </p>
                  )}
                </div>
              )}
            </div>
            {currentTab === "events" && (
              <div className="browseContainer__eventsTabContainer white flex flex-column">
                {!isLoading && eventsTabContent()}
              </div>
            )}
            {currentTab === "vips/packages" && (
              <div className="browseContainer__listingsTabContainer white flex flex-column">
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
