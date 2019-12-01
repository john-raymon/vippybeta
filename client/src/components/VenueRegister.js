import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import * as yup from "yup";
import {
  phoneNumber as phoneNumberRegExp,
  password as passwordRegExp,
  zipCode as zipCodeRegExp
} from "./../utils/regExp";

// components
import RegisterFormTextField from "./FormField";
import ListingLineItem from "./ListingLineItem";

// svgs
import GlobeIcon from "../svgs/globe-icon-svg";

export default class VenueRegister extends Component {
  constructor(props) {
    super(props);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.validate = this.validate.bind(this);
    this.resetErrorsState = this.resetErrorsState.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.state = {
      newVenue: {
        fullName: "",
        zipCode: "",
        phoneNumber: "",
        email: "",
        venueName: "",
        password: "",
        accessCode: "",
        legalVenueName: "",
        confirmPassword: "" // keep outside of newVenue since we're only concerned with this on client-side not sending it server
      },
      error: "",
      errors: {}
    };
  }

  // on initial mount, we locationState from location prop using history to redirect based off the isAuth prop
  // this will redirect any logged venue owner.
  componentDidMount() {
    const { isAuth, location, history } = this.props;
    const { state: locationState } = location;
    if (isAuth) {
      if (locationState) {
        history.replace(locationState.from);
      } else {
        history.replace("/dashboard");
      }
    }
  }

  // we do the same thing we do in the initial mount, except if the isAuth prop changes
  // it will trigger the componentDidUpdate lifecycle method thus causing a redirect or not
  componentDidUpdate() {
    const { isAuth, location, history } = this.props;
    const { state: locationState } = location;
    if (isAuth) {
      if (locationState) {
        history.replace(locationState.from);
      } else {
        history.replace("/dashboard");
      }
    }
  }

  // resets error state
  resetErrorsState() {
    this.setState({
      error: "",
      errors: {}
    });
  }

  // validate the new venue object using Yup; Object Schema Validation
  validate(venue) {
    const venueSchema = yup.object().shape({
      email: yup
        .string()
        .email("Please enter a valid email")
        .required(
          "The email of the venue or a representative of the venue is required"
        ),
      phoneNumber: yup
        .string()
        .matches(phoneNumberRegExp, {
          message: "Your phone must be a valid phone number"
        })
        .label("Phone number")
        .required("The venue's phone number is required."),
      password: yup
        .string()
        .min("8", "Password is too short - should be 8 chars minimum")
        .matches(passwordRegExp, {
          message:
            "Your password must have a minimum of eight characters, and at least one number"
        })
        .required("Oops, please create a password"),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref("password"), null], "Passwords don't match")
        .required("Confirm your password"),
      fullName: yup
        .string()
        .required("Please provide the full name of an owner or manager."),
      legalVenueName: yup
        .string()
        .required(
          "Please provide the legal name of the business, or entity. (Example LLC)"
        ),
      zipCode: yup
        .string()
        .matches(zipCodeRegExp, {
          message: "Please enter a valid zip code"
        })
        .required("Please enter the zip code of the venue."),
      accessCode: yup
        .string()
        .required(
          "Your access code is required to register. Contact us at info@getvippy.com if you forgot your code."
        )
    });
    return venueSchema.validate(venue, {
      abortEarly: false
    });
  }

  // handle any type of input type and update respective state property's value
  handleFormChange(e) {
    this.setState({
      newVenue: {
        ...this.state.newVenue,
        [e.target.name]: e.target.value
      }
    });
  }

  // on a form submit, create object representing newVenue to be passed to this.validate method
  // to be validated against our Yup schema above (see instance validate method)
  // if validation successful then initiate request to Create endpoint for Venue via the
  // venueRegisterDispatch binded ActionCreator method
  // if any errors, state will be updated locally to reflect
  // if successful then redux will be updated, thus updating this.props.isAuth
  // causing redirection within componentDidUpdate
  onFormSubmit(e) {
    e.preventDefault();
    this.resetErrorsState();
    // construct new venue object that will be passed to yup for schema validation
    const newVenue = {
      ...this.state.newVenue
    };
    this.validate(newVenue)
      .then(validatedNewVenue => {
        return this.props
          .venueRegisterDispatch(validatedNewVenue, this.props.venueAgent)
          .then(resp => {
            // after a sucessfull registration we can attempt to get the stripe OAuth url to begin
            // connecting Stripe account
            // make request to /api/host/stripe/auth
            return this.props.venueAgent.getStripeoAuthUrl().then(resp => {
              if (resp.success) {
                // similar behavior as an HTTP redirect
                return window.location.replace(resp.redirectUrl);
              }
              throw Error("We apologize for the inconvenience"); // TODO: if failed for internal reasons, attempt to fetch redirect url again, if failed set up job
              // to have vippy contact them, or have them return to the site later to complete it via
              // an email as we get it fixed
            });
          }); // Redux will update auth state and trigger a location change if successful login
      })
      .catch(error => {
        window.scrollTo(0, 0);
        // COMMON GOTCHA: The yup returns a ValidationError that has aggregated Yup ValidationError(s) within it
        // our backend can/may return mongoose ValidationError(s) that do not contain an inner property but do
        // contain an errors property
        if (!error) {
          return this.setState({
            error:
              "We're sorry, we're experiencing technical issues. Please try again or contact us at info@getvippy.com."
          });
        }
        // catch validation errors
        if (error.name && error.name === "ValidationError") {
          if (error.inner) {
            // error.inner is array of Yup ValidationErrors
            // if has inner then it is a Yup ValidationError thrown from this.validate method
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
          }
          if (error.errors) {
            // error.errors is object with keys matching path, and value as the Mongoose ValidationError
            return this.setState({
              errors: error.errors
            });
          }
          // if errors is empty and inner doesn't exist then (since inner will never be empty if Yup validationError)
          // state update below will be returned
        }
        // any other error
        return this.setState({
          error:
            error.message ||
            "We're sorry, we're experiencing technical issues. Please try again or contact us at info@getvippy.com."
        });
      });
  }

  render() {
    const { newVenue, error, errors } = this.state;
    return (
      <div className="flex flex-column flex-row-l mw8 center pv4 ph1">
        <div className="registerComponent flex flex-column w-100">
          <h1 className="michroma tracked lh-title white tw-text-xl lg:tw-text-4xl f2-ns tw-text-center mb2 mt0">
            Optimize the reservation experience for your events. Register your
            venue.
          </h1>

          {error && (
            <p className="michroma f6 tracked tw-text-center yellow lh-copy o-70 pt3 pb3">
              {error}
            </p>
          )}

          <div className="tw-flex tw-flex-col md:tw-flex-row tw-py-8 md:tw-py-6">
            <form
              className="registerComponent__form flex flex-column tw-w-full md:tw-w-6/12 tw-mt-6"
              onChange={this.handleFormChange}
            >
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="What's legal business name of venue?"
                  type="text"
                  label="Legal Venue Name"
                  name="legalVenueName"
                  value={newVenue.legalVenueName}
                />

                {errors.legalVenueName && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.legalVenueName}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="What's the venue's email?"
                  type="email"
                  label="Email"
                  name="email"
                  value={newVenue.email}
                />

                {errors.email && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Enter your Phone Number"
                  type="text"
                  label="Phone Number"
                  name="phoneNumber"
                  value={newVenue.phoneNumber}
                />
                {(errors.phoneNumber || errors.phonenumber) && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.phoneNumber || errors.phonenumber}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Enter Your Zip Code"
                  type="text"
                  label="Zip Code"
                  name="zipCode"
                  value={newVenue.zipCode}
                />
                {errors.zipCode && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.zipCode}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Create a password"
                  type="password"
                  label="Password"
                  name="password"
                  value={newVenue.password}
                />
                {errors.password && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.password}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Confirm your password"
                  type="password"
                  label="Confirm Password"
                  name="confirmPassword"
                  value={newVenue.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Ex. Nova Rae"
                  type="text"
                  label="Full Name"
                  name="fullName"
                  value={newVenue.fullName}
                />
                {errors.fullName && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.fullName}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Venue Access Code"
                  type="text"
                  label="Access Code"
                  name="accessCode"
                  value={newVenue.accessCode}
                />
                <p className="michroma tw-text-xs tw-leading-tight tw-text-white tw-tracking-widest tw-capitalize tw-mt-2 tw-text-gray-500">
                  venue verification code provided by a Vippy representative
                </p>
                {errors.accessCode && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.accessCode}
                  </p>
                )}
              </div>
              <button
                className="vippyButton mt4 mw1 self-end dim"
                onClick={this.onFormSubmit}
                type="submit"
              >
                <div className="vippyButton__innerColorBlock">
                  <div className="w-100 h-100 flex flex-column justify-center">
                    <p className="michroma tracked-1 b ttu lh-extra white-90 center pb1">
                      sign up
                    </p>
                  </div>
                </div>
              </button>
            </form>
            <div className="tw-flex tw-justify-end tw-items-center tw-flex-grow md:tw-px-6 tw-order-first md:tw-order-none">
              <div className="tw-flex tw-items-center tw-flex-col tw-w-full md:tw-items-end">
                <div className="tw-flex md:tw-justify-between tw-items-center tw-max-w-sm">
                  <div className="tw-w-10 tw-max-w-xs tw-order-last md:tw-order-first">
                    <GlobeIcon />
                  </div>
                  <p className="tw-w-48 tw-text-sm md:tw-text-right tw-text-white tw-leading-relaxed tw-tracking-wider">
                    We don’t charge anything up-front
                  </p>
                </div>
                <p className="tw-w-full tw-text-center tw-text-xs tw-text-gray-600 tw-mt-2 md:tw-text-right tw-leading-relaxed md:tw-max-w-sm lg:tw-max-md">
                  We only charge a 15 percent fee when a reservation is made at
                  your venue. Allowing you to get up and running online with no
                  hassle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
