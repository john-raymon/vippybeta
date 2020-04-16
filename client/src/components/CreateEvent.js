import React, { Component, Fragment } from "react";
import { motion } from "framer-motion";
import moment from "moment";
import TextField from "@material-ui/core/TextField";
import { PreviewEventCard } from "./Cards";
import { Calendar } from "react-date-range";
import { StaticGoogleMap, Marker, Path } from "react-static-google-map";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import NativeSelect from "@material-ui/core/NativeSelect";
import InputBase from "@material-ui/core/InputBase";
import VippyLogo from "../svgs/logo";
import * as yup from "yup";
import {
  phoneNumber as phoneNumberRegExp,
  password as passwordRegExp,
  zipCode as zipCodeRegExp
} from "./../utils/regExp";

const SInputBase = withStyles(theme => ({
  input: {
    position: "relative",
    borderRadius: 4,
    color: theme.palette.grey[800],
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.grey[400]}`,
    fontSize: 16,
    padding: "1rem",
    "&:hover": {
      borderColor: "black",
      backgroundColor: theme.palette.background.paper
    },
    "&:focus": {
      borderRadius: 4,
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.primary.main
    }
  }
}))(InputBase);

export default class CreateEvent extends Component {
  constructor(props) {
    super(props);
    this.handleStartTimeChange = this.handleStartTimeChange.bind(this);
    this.handleEndTimeChange = this.handleEndTimeChange.bind(this);
    this.formatMilitaryTime = this.formatMilitaryTime.bind(this);
    this.validate = this.validate.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.containerRef = React.createRef();
    this.state = {
      initialRootVariant: "hidden",
      newEvent: {
        name: "",
        startTime: new Date(
          moment()
            .add("1", "days")
            .startOf("day")
            .format()
        ),
        endTime: new Date(
          moment()
            .add("1", "days")
            .startOf("day")
            .format()
        ),
        venueName: "test",
        street: "335 n magnolia",
        streetTwo: "",
        city: "orlando",
        state: "FL",
        zip: "32801",
        organizer: ""
      },
      selectedStartTime: "0000",
      selectedEndTime: "0000",
      timeSlots: [],
      allStates: {
        AL: "Alabama",
        AK: "Alaska",
        AS: "American Samoa",
        AZ: "Arizona",
        AR: "Arkansas",
        CA: "California",
        CO: "Colorado",
        CT: "Connecticut",
        DE: "Delaware",
        DC: "District Of Columbia",
        FM: "Federated States Of Micronesia",
        FL: "Florida",
        GA: "Georgia",
        GU: "Guam",
        HI: "Hawaii",
        ID: "Idaho",
        IL: "Illinois",
        IN: "Indiana",
        IA: "Iowa",
        KS: "Kansas",
        KY: "Kentucky",
        LA: "Louisiana",
        ME: "Maine",
        MH: "Marshall Islands",
        MD: "Maryland",
        MA: "Massachusetts",
        MI: "Michigan",
        MN: "Minnesota",
        MS: "Mississippi",
        MO: "Missouri",
        MT: "Montana",
        NE: "Nebraska",
        NV: "Nevada",
        NH: "New Hampshire",
        NJ: "New Jersey",
        NM: "New Mexico",
        NY: "New York",
        NC: "North Carolina",
        ND: "North Dakota",
        MP: "Northern Mariana Islands",
        OH: "Ohio",
        OK: "Oklahoma",
        OR: "Oregon",
        PW: "Palau",
        PA: "Pennsylvania",
        PR: "Puerto Rico",
        RI: "Rhode Island",
        SC: "South Carolina",
        SD: "South Dakota",
        TN: "Tennessee",
        TX: "Texas",
        UT: "Utah",
        VT: "Vermont",
        VI: "Virgin Islands",
        VA: "Virginia",
        WA: "Washington",
        WV: "West Virginia",
        WI: "Wisconsin",
        WY: "Wyoming"
      },
      error: "",
      errors: {}
    };
  }

  componentDidMount() {
    let militaryTime = [];
    for (let hourCount = 0, minCount = -30, totalTime = 0; totalTime < 2330; ) {
      hourCount = minCount === 30 ? hourCount + 1 : hourCount;
      minCount = minCount === 30 ? 0 : minCount + 30;
      totalTime = `${("0" + hourCount).slice(-2)}${("0" + minCount).slice(-2)}`;
      militaryTime = [...militaryTime, totalTime];
    }
    this.setState({ initialRootVariant: "visible", timeSlots: militaryTime });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedStartTime !== this.state.selectedStartTime) {
      this.handleStartTimeChange();
    }
    if (prevState.selectedEndTime !== this.state.selectedEndTime) {
      this.handleEndTimeChange();
    }
  }

  formatMilitaryTime(time) {
    return moment(time, "kkmm a").format("hh:mm a");
  }

  handleStartTimeChange(date = this.state.newEvent.startTime) {
    const startTimeHours = `${this.state.selectedStartTime[0]}${
      this.state.selectedStartTime[1]
    }`;
    const startTimeMinutes = `${this.state.selectedStartTime[2]}${
      this.state.selectedStartTime[3]
    }`;
    const eventStartTime = moment(date)
      .startOf("day")
      .add(startTimeHours, "hours")
      .add(startTimeMinutes, "minutes")
      .format();
    console.log(
      "the event start time is",
      moment(date)
        .startOf("day")
        .add(startTimeHours, "hours")
        .add(startTimeMinutes, "minutes")
        .format("LLL")
    );
    this.setState({
      newEvent: { ...this.state.newEvent, startTime: eventStartTime }
    });
  }

  handleEndTimeChange(date = this.state.newEvent.endTime) {
    const endTimeHours = `${this.state.selectedEndTime[0]}${
      this.state.selectedEndTime[1]
    }`;
    const endTimeMinutes = `${this.state.selectedEndTime[2]}${
      this.state.selectedEndTime[3]
    }`;
    const eventEndTime = moment(date)
      .startOf("day")
      .add(endTimeHours, "hours")
      .add(endTimeMinutes, "minutes")
      .format();
    console.log(
      "the event end time is",
      moment(date)
        .startOf("day")
        .add(endTimeHours, "hours")
        .add(endTimeMinutes, "minutes")
        .format("LLL")
    );
    this.setState({
      newEvent: { ...this.state.newEvent, endTime: eventEndTime }
    });
  }

  // validate the new event object using Yup; Object Schema Validation
  validate(event) {
    const eventSchema = yup.object().shape({
      name: yup.string().required("Create a title for your event"),
      venueName: yup
        .string()
        .required("Please provide the name of the venue or location."),
      street: yup.string().required("Please provide a street address."),
      zip: yup
        .string()
        .matches(zipCodeRegExp, {
          message: "Please enter a valid zip code"
        })
        .required("Please enter the zip code of the venue or location."),
      city: yup.string().required("Please provide a city."),
      state: yup.string().required("Please select a state."),
      startTime: yup
        .date()
        .required("Please provide the start date and time for the event"),
      endTime: yup
        .date()
        .required("Please provide the end date and time for the event")
    });
    return eventSchema.validate(event, {
      abortEarly: false
    });
  }

  onSubmit() {
    this.setState({
      errors: {}
    });
    const { newEvent } = this.state;
    this.validate(newEvent)
      .then(value => {
        console.log("fulfilled with value", value);
        return this.props.venueAgent.createEvent(value).catch(error => {
          throw { ...error, requestType: "api" };
        });
      })
      .then(resp => {
        // on successful resp from POST /api/event via venueAgent.createEvent redirect to create listings page with id
        return this.props.history.replace(
          `create-listings/${resp.event.id}/new`
        );
      })
      .catch(error => {
        this.containerRef.current.scrollTo(0, 0);
        // error.inner is array of Yup ValidationErrors
        // if has inner then it is a Yup ValidationError thrown from this.validate method
        if (error.requestType) {
          // this.
          if (Object.entries(error.errors || {}).length) {
            return this.setState({
              errors: error.errors
            });
          }
          if (error.path) {
            return this.setState({
              errors: {
                [error.path]: error.message || ""
              }
            });
          }
          return this.setState({
            error: "Sorry, we aren't able to create your event right now."
          });
        }
        let errors = {};
        error.inner.forEach(error => {
          errors = {
            ...errors,
            [error.path]: error.message
          };
        });
        return this.setState({
          errors
        });
      });
  }

  render() {
    const rootVariants = {
      visible: {
        y: 0,
        transition: { duration: 0.15 }
      },
      hidden: {
        y: "200%"
      }
    };
    const { newEvent, errors } = this.state;
    const errorsAsEntries = Object.entries(this.state.errors);
    const encodedEventAddress = encodeURI(
      `${newEvent.street} ${newEvent.streetTwo} ${newEvent.city} ${this.state
        .allStates[newEvent.state] || ""} ${newEvent.zip}`.trim("")
    );
    console.log("current encode event address", encodedEventAddress);
    return (
      <Fragment>
        <button
          aria-label="Close"
          onClick={() => this.props.history.goBack()}
          className="tw-fixed tw-bg-black tw-h-screen tw-w-full tw-z-50 tw-top-0 tw-left-0 tw-opacity-75"
        />
        <motion.div
          initial="hidden"
          animate={this.state.initialRootVariant}
          variants={rootVariants}
          ref={this.containerRef}
          className="create-event tw-fixed tw-bottom-0 tw-right-0 tw-w-full tw-h-full tw-z-50 tw-bg-white tw-overflow-y-scroll"
        >
          <div className="create-event__inner-container tw-relative">
            <div className="tw-sticky tw-top-0 tw-w-full tw-bg-white tw-z-40 tw-shadow-2xl">
              <div className="tw-sticky tw-flex tw-items-center tw-justify-between tw-w-full tw-top-0 tw-right-0 tw-p-2 tw-bg-black md:tw-px-10 lg:tw-px-20">
                <div className="tw-w-20 tw-fill-current tw-text-black">
                  <VippyLogo />
                </div>
                <div className="tw-flex tw-items-center tw-justify-start tw-flex-grow tw-pl-2">
                  <p className="tw-text-2xs tw-text-gray-200 tw-opacity-75 ttw-text-left tw-font-black tw-normal-case tw-tracking-wider tw-leading-snug">
                    Create an Event
                  </p>
                </div>
                <button
                  onClick={() => this.props.history.push("/dashboard")}
                  className="tw-w-10 tw-h-10 tw-flex tw-fill-current tw-text-white tw-right-0"
                >
                  <svg width="100%" height="100%" viewBox="0 0 512 512">
                    <path d="m278.6 256 68.2-68.2c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0l-68.2 68.2-68.2-68.2c-6.2-6.2-16.4-6.2-22.6 0-3.1 3.1-4.7 7.2-4.7 11.3s1.6 8.2 4.7 11.3l68.2 68.2-68.2 68.2c-3.1 3.1-4.7 7.2-4.7 11.3s1.6 8.2 4.7 11.3c6.2 6.2 16.4 6.2 22.6 0l68.2-68.2 68.2 68.2c6.2 6.2 16.4 6.2 22.6 0s6.2-16.4 0-22.6z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="tw-relative tw-flex tw-flex-col lg:tw-flex-row tw-mx-auto tw-max-w-6xl">
              <div className="tw-flex tw-sticky _top-14 tw-justify-start tw-items-start tw-w-full lg:tw-w-2/5 tw-z-30 tw-bg-white tw-px-3 tw-shadow-xl lg:tw-shadow-none">
                <div className="tw-sticky tw-top-0 tw-flex tw-flex-col tw-items-center tw-w-full sm:tw-w-3/5 lg:tw-w-full tw-mx-auto tw-py-3 lg:tw-pt-20">
                  <p className="tw-text-xs tw-text-gray-600 tw-text-black tw-pb-1 tw-mb-2 tw-border-b tw-border-gray-300 self-start">
                    Event Preview:
                  </p>
                  <PreviewEventCard
                    venueName={newEvent.venueName || "venue name"}
                    eventOrganizer={newEvent.organizer}
                    eventTitle={this.state.newEvent.name || "event title"}
                    eventStartTime={this.state.newEvent.startTime}
                    eventEndTime={this.state.newEvent.endTime}
                    newRootClasses="tw-w-full tw-flex-shrink"
                    newInnerContainerClasses="tw-flex tw-flex-row tw-justify-end tw-items-start tw-self-stretch"
                    textColor="black"
                  />
                </div>
              </div>
              <div className="tw-flex tw-flex-col tw-px-4 lg:tw-px-2 tw-pt-8">
                {(errorsAsEntries.length || "") &&
                  errorsAsEntries.map(([errorPath, errorMessage], i) => {
                    return (
                      <p
                        key={i}
                        className="small-text tw-text-red-400 tw-text-center tw-w-full tw-py-4"
                      >
                        {errorMessage}
                      </p>
                    );
                  })}
                <section className="tw-flex tw-flex-wrap tw-w-full md:tw-mt-2 tw-border-b tw-border-gray-200 tw-py-8">
                  <div className="tw-sticky tw-top-0 tw-flex tw-items-start tw-w-full md:tw-w-1/5 md:tw-border-r tw-border-gray-300 tw-py-4 md:tw-pr-6">
                    <p className="tw-font-mich tw-w-full tw-text-center md:tw-text-left tw-text-sm tw-text-gray-800 tw-tracking-wider tw-leading-relaxed tw-normal-case">
                      Basic Information
                    </p>
                  </div>
                  <div className="tw-flex tw-flex-col tw-flex-grow md:tw-pl-4">
                    <div className="tw-flex-row tw-flex-wrap">
                      <TextField
                        className="tw-w-full tw-my-1 md:tw-w-1/2 md:tw-pr-4"
                        label="Event Title"
                        variant="outlined"
                        onChange={e =>
                          this.setState({
                            newEvent: {
                              ...this.state.newEvent,
                              name: e.target.value
                            }
                          })
                        }
                        value={this.state.newEvent.name}
                      />
                      <TextField
                        className="tw-w-full tw-my-1 md:tw-w-1/2"
                        label="Event Organizer"
                        variant="outlined"
                        onChange={e =>
                          this.setState({
                            newEvent: {
                              ...this.state.newEvent,
                              organizer: e.target.value
                            }
                          })
                        }
                        value={this.state.newEvent.eventOrganizer}
                      />
                    </div>
                  </div>
                </section>

                {errorsAsEntries
                  .filter(([path, message]) => path.split(".")[0] === "address")
                  .map((error, i) => {
                    return (
                      <p
                        key={i}
                        className="small-text tw-text-red-400 tw-text-center tw-w-full tw-py-4 tw-mt-2"
                      >
                        {error[1]}
                      </p>
                    );
                  })}
                <section
                  className={`tw-flex tw-flex-wrap tw-w-full tw-border-b tw-border-gray-200 tw-py-8 ${(errorsAsEntries.filter(
                    ([path, message]) => path.split(".")[0] === "address"
                  ).length ||
                    "") &&
                    "tw-border tw-border-red-400 tw-rounded"}`}
                >
                  <div className="tw-flex tw-items-start tw-w-full md:tw-w-1/5 md:tw-border-r tw-border-gray-300 tw-py-6 md:tw-pr-6">
                    <p className="tw-font-mich tw-w-full tw-text-center md:tw-text-left tw-text-sm tw-text-gray-800 tw-tracking-wider tw-leading-relaxed tw-normal-case">
                      Event Location
                    </p>
                  </div>
                  <div className="tw-flex tw-flex-col tw-w-full md:tw-w-4/5 md:tw-pl-4">
                    <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center">
                      <div className="tw-flex tw-flex-col tw-justify-center tw-w-full md:tw-w-1/2 md:tw-pr-4">
                        <TextField
                          className="tw-w-full tw-mb-4"
                          label="Venue Name"
                          onChange={e =>
                            this.setState({
                              newEvent: {
                                ...newEvent,
                                venueName: e.target.value
                              }
                            })
                          }
                          value={newEvent.venueName}
                          variant="outlined"
                          color="primary"
                        />
                        <TextField
                          className="tw-w-full tw-mb-4"
                          onChange={e =>
                            this.setState({
                              newEvent: { ...newEvent, street: e.target.value }
                            })
                          }
                          value={newEvent.street}
                          label="Address 1"
                          variant="outlined"
                          color="primary"
                        />
                        <TextField
                          className="tw-w-full tw-mb-4"
                          onChange={e =>
                            this.setState({
                              newEvent: {
                                ...newEvent,
                                streetTwo: e.target.value
                              }
                            })
                          }
                          value={newEvent.streetTwo}
                          label="Address 2"
                          variant="outlined"
                          color="primary"
                        />
                        <div className="tw-flex tw-w-full tw-mb-4">
                          <TextField
                            className="tw-w-1/2"
                            onChange={e =>
                              this.setState({
                                newEvent: { ...newEvent, city: e.target.value }
                              })
                            }
                            value={newEvent.city}
                            label="City"
                            variant="outlined"
                            color="primary"
                          />
                          <TextField
                            className="tw-w-1/2 tw-ml-4"
                            onChange={e =>
                              this.setState({
                                newEvent: { ...newEvent, zip: e.target.value }
                              })
                            }
                            value={newEvent.zip}
                            label="Zip Code"
                            variant="outlined"
                            color="primary"
                          />
                        </div>
                        <FormControl variant="outlined">
                          <Select
                            onChange={e =>
                              this.setState({
                                newEvent: { ...newEvent, state: e.target.value }
                              })
                            }
                            value={newEvent.state}
                            input={<SInputBase />}
                          >
                            {Object.entries(this.state.allStates).map(
                              ([stateCode, stateName]) => {
                                return (
                                  <MenuItem key={stateCode} value={stateCode}>
                                    {stateName}
                                  </MenuItem>
                                );
                              }
                            )}
                          </Select>
                        </FormControl>
                      </div>
                      <div className="tw-flex tw-justify-center tw-w-auto md:tw-w-1/2 tw-py-4">
                        {encodedEventAddress ? (
                          <StaticGoogleMap
                            className="tw-shadow-lg"
                            size="300x300"
                            apiKey={
                              process.env.REACT_APP_GOOGLE_GEOCODING_API_KEY
                            }
                          >
                            <Marker location={encodedEventAddress} />
                          </StaticGoogleMap>
                        ) : (
                          // render place holder if no address entered for event
                          <div className="tw-bg-gray-700 tw-opacity-25 tw-w-64 tw-h-64 tw-shadow" />
                        )}
                      </div>
                    </div>
                  </div>
                </section>
                {errorsAsEntries
                  .filter(
                    ([path, message]) =>
                      path === "eventStartTime" || path === "eventEndTime"
                  )
                  .map((error, i) => {
                    return (
                      <p
                        key={i}
                        className="small-text tw-text-red-400 tw-text-center tw-w-full tw-py-4"
                      >
                        {error[1]}
                      </p>
                    );
                  })}
                <section
                  className={`tw-flex tw-flex-wrap tw-w-full tw-mb-10 tw-py-8 tw-border-b tw-border-gray-200 ${(this
                    .state.errors["eventStartTime"] ||
                    this.state.errors["eventEndTime"] ||
                    "") &&
                    "tw-border tw-border-red-400 tw-rounded"}`}
                >
                  <div className="tw-flex tw-items-start tw-w-full md:tw-w-1/5 md:tw-border-r tw-border-gray-300 tw-py-4 md:tw-pr-6">
                    <p className="tw-font-mich tw-w-full tw-text-center md:tw-text-left tw-text-sm tw-text-gray-800 tw-tracking-wider tw-leading-relaxed tw-normal-case">
                      Date & Time
                    </p>
                  </div>
                  <div className="tw-relative tw-flex tw-items-center tw-flex-col tw-w-4/5 tw-flex-grow">
                    <div className="tw-w-full tw-flex tw-flex-col tw-justify-start tw-items-center tw-mt-4">
                      <div className="tw-flex tw-flex-col tw-justify-between tw-w-2/3 tw-items-center">
                        <p className="tw-font-mich tw-w-full tw-pb-2 tw-text-left tw-text-sm tw-text-gray-600 tw-tracking-wider tw-leading-relaxed tw-normal-case">
                          Event Starts*
                        </p>
                        <FormControl variant="outlined" className="tw-w-full">
                          <Select
                            onChange={e =>
                              this.setState({
                                selectedStartTime: e.target.value
                              })
                            }
                            value={this.state.selectedStartTime}
                            input={<SInputBase />}
                          >
                            {this.state.timeSlots.map(time => {
                              return (
                                <MenuItem key={time} value={time}>
                                  {this.formatMilitaryTime(time)}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </div>
                      <Calendar
                        showSelectionPreview={false}
                        className="tw-relative tw-font-mich tw-w-full tw-flex tw-items-center"
                        date={new Date(this.state.newEvent.startTime)}
                        onChange={this.handleStartTimeChange}
                      />
                    </div>
                    <div className="tw-w-full tw-flex tw-flex-col tw-justify-start tw-items-center tw-mt-4">
                      <div className="tw-flex tw-flex-col tw-justify-between tw-w-2/3 tw-items-center">
                        <p className="tw-font-mich tw-w-full tw-pb-2 tw-text-left tw-text-sm tw-text-gray-600 tw-tracking-wider tw-leading-relaxed tw-normal-case">
                          Event Ends*
                        </p>
                        <FormControl variant="outlined" className="tw-w-full">
                          <Select
                            onChange={e =>
                              this.setState({ selectedEndTime: e.target.value })
                            }
                            value={this.state.selectedEndTime}
                            input={<SInputBase />}
                          >
                            {this.state.timeSlots.map(time => {
                              return (
                                <MenuItem key={time} value={time}>
                                  {this.formatMilitaryTime(time)}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </div>
                      <Calendar
                        showSelectionPreview={false}
                        className="tw-relative tw-font-mich tw-w-full tw-flex tw-items-center"
                        date={new Date(this.state.newEvent.endTime)}
                        onChange={this.handleEndTimeChange}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <div className="tw-block tw-sticky tw-bottom-0 tw-z-30">
              <button
                onClick={this.onSubmit}
                className="tw-font-mich tw-bg-green-700 tw-px-12 tw-py-6 tw-text-xs tw-w-full tw-tracking-widest-1 tw-text-white"
              >
                create event
              </button>
            </div>
          </div>
        </motion.div>
      </Fragment>
    );
  }
}
