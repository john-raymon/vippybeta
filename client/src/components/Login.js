import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as yup from "yup";

// reg exp
import {
  phoneNumber as phoneNumberRegExp,
  password as passwordRegExp,
  zipCode as zipCodeRegExp
} from "./../utils/regExp";

// components
import FormField from "./FormField";
import ListingLineItem from "./ListingLineItem";

class Login extends Component {
  constructor(props) {
    super(props);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.validate = this.validate.bind(this);
    this.resetErrors = this.resetErrors.bind(this);
    this.state = {
      emailOrPhoneNumber: "",
      password: "",
      error: "",
      errors: [],
      venue: {
        email: "",
        password: ""
      }
    };
  }
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
  resetErrors() {
    this.setState({
      error: "",
      errors: []
    });
  }
  handleFormChange(e, loginType) {
    let stateUpdate = {};
    if (loginType === "venue") {
      stateUpdate = {
        venue: {
          ...this.state.venue,
          [e.target.name]: e.target.value
        }
      };
    } else {
      stateUpdate = {
        [e.target.name]: e.target.value
      };
    }
    this.setState(stateUpdate);
  }
  validate(credentials, isEmail, loginType) {
    if (loginType === "venue") {
      // validate using venue schema return results
      // regular user by default
      const schema = yup.object().shape({
        email: yup
          .string()
          .email()
          .required("You must enter a valid email"),
        password: yup.string().required("Please enter your password")
      });
      return schema.validate(credentials, {
        abortEarly: false
      });
    } else {
      // regular user by default
      const schema = yup.object().shape({
        emailOrPhoneNumber: yup.string().when("$isEmail", {
          is: true,
          then: yup
            .string()
            .email()
            .required("You must enter a valid email")
            .label("Email"),
          otherwise: yup
            .string()
            .required("Please enter a valid phone number or email")
        }),
        password: yup.string().required("Please enter your password")
      });
      return schema.validate(credentials, {
        abortEarly: true,
        context: { isEmail }
      });
    }
  }
  onFormSubmit(e, loginType) {
    e.preventDefault();
    if (loginType === "venue") {
      // login venue
      this.resetErrors();
      const credentials = {
        email: this.state.venue.email,
        password: this.state.venue.password
      };
      this.validate(credentials, undefined, "venue")
        .then(validatedVenueCredentials => {
          return this.props.venueLogin(
            validatedVenueCredentials,
            this.props.venueAgent
          );
        })
        .catch(error => {
          let errorStateUpdate = {
            error:
              "We could not log you in right now. Please contact info@getvippy.com"
          };
          if (error.name === "BadRequest") {
            errorStateUpdate = {
              error: error.message
            };
          }
          if (error.name === "ValidationError") {
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
              errorStateUpdate = { errors };
            }
          }
          this.setState(errorStateUpdate);
        });
    } else {
      this.resetErrors();
      const isEmail = this.state.emailOrPhoneNumber.includes("@");
      const credentials = {
        emailOrPhoneNumber: this.state.emailOrPhoneNumber,
        password: this.state.password
      };
      this.validate(credentials, isEmail)
        .then(validatedCredentials => {
          return this.props.regularLogin(
            {
              email: isEmail ? this.state.emailOrPhoneNumber : "",
              phoneNumber: this.state.emailOrPhoneNumber,
              password: this.state.password
            },
            this.props.userAgent
          );
        })
        .catch(error => {
          if (error.statusCode) {
            if (error.statusCode === 500) {
              return this.setState({
                error:
                  "We are experiencing issues right now, we apologize for the inconvenience."
              });
            }
            return this.setState({
              error:
                "The credentials you provided are incorrect, please try again."
            });
          }
          if (error.name === "ValidationError") {
            this.setState({
              error: error.message
            });
          }
        });
    }
  }
  render() {
    const { error, errors } = this.state;
    if (this.props.typeOfLogin === "venue") {
      return (
        <div className="flex flex-column flex-row-l tw-w-full tw-max-w-5xl center pt4 ph1">
          <div className="w-100 w-50-l ph3-l  mb0-l tw-flex">
            <div className="tw-flex tw-flex-col tw-w-full md:tw-items-end md:tw-pt-16">
              <div className="tw-w-full md:tw-justify-between tw-items-center">
                <p className="tw-w-full tw-text-sm tw-text-white tw-leading-relaxed tw-tracking-wider">
                  Quick tip.
                </p>
              </div>
              <p className="tw-w-full tw-text-xs tw-text-gray-600 tw-mt-2 tw-text-left tw-leading-relaxed">
                You can create accounts for promoters at your venue; granting
                permissions to redeem reservations, and list events along with
                packages. Go to your accounts settings to complete this task.
              </p>
            </div>
          </div>
          <div className="login-component w-100 w-50-l ph1 ph3-l">
            <h1 className="login-component__header michroma tracked lh-title white ttc f3 f2-ns pr4 mb3">
              venue sign in
            </h1>
            {error && (
              <p className="michroma tw-text-xs tracked ttc tw-text-red-500 lh-copy o-70 tw-py-2">
                {error}
              </p>
            )}
            <form
              className="flex flex-column w-100 mt2"
              onChange={e => this.handleFormChange(e, "venue")}
            >
              <div className="mb2">
                <FormField
                  placeholder="Enter your email address"
                  type="text"
                  label="Email Address"
                  name="email"
                  value={this.state.venue.email}
                />
                {errors.email && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="mb2">
                <FormField
                  placeholder="Enter your password"
                  type="password"
                  label="Password"
                  name="password"
                  value={this.state.venue.password}
                />
                {errors.password && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {errors.password}
                  </p>
                )}
              </div>
              <button
                className="vippyButton mt4 mw1 self-end dim"
                onClick={e => this.onFormSubmit(e, "venue")}
                type="submit"
              >
                <div className="vippyButton__innerColorBlock">
                  <div className="w-100 h-100 flex flex-column justify-center">
                    <p className="michroma tracked-1 b ttu lh-extra white-90 center pb1">
                      login
                    </p>
                  </div>
                </div>
              </button>
            </form>
            <Link
              to={{
                pathname: "/sign-up",
                state: {
                  from:
                    this.props.location.state && this.props.location.state.from
                }
              }}
            >
              or create an account
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-column flex-row-l mw8 center pt4 ph1">
        <div className="w-100 w-50-l ph3-l mb3 mb0-l">
          {this.props.location.state &&
          this.props.location.state.from.state &&
          this.props.location.state.from.state.continueCheckout ? (
            <ListingLineItem
              listingId={this.props.location.state.from.state.listingId}
              userAgent={this.props.userAgent}
            />
          ) : (
            <div className="sticky top-from-nav mt4 mt0-l w-100 flex flex-column flex-row-m">
              <p className="michroma f4 tracked b lh-copy white-90 pa3 w-70 z-2">
                Know What To Expect Before Going Out by Reserving on Vippy.
                <span className="db lh-copy white tw-text-xs tw-text-gray-500 pt3">
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
          )}
        </div>
        <div className="login-component w-100 w-50-l ph1 ph3-l">
          <h1 className="login-component__header michroma tracked lh-title white ttc f3 f2-ns pr4 mb3">
            sign in
          </h1>
          {error && (
            <p className="michroma f6 tracked ttc yellow lh-copy o-70 pt3 pb3">
              {error}
            </p>
          )}
          <form
            className="flex flex-column w-100 mt2"
            onChange={this.handleFormChange}
          >
            <div className="mb2">
              <FormField
                placeholder="Enter your phone number or email"
                type="text"
                label="Phone Number or Email"
                name="emailOrPhoneNumber"
                value={this.state.emailOrPhoneNumber}
              />
            </div>
            <div className="mb2">
              <FormField
                placeholder="Enter your password"
                type="password"
                label="Password"
                name="password"
                value={this.state.password}
              />
            </div>
            <button
              className="vippyButton mt4 mw1 self-end dim"
              onClick={this.onFormSubmit}
              type="submit"
            >
              <div className="vippyButton__innerColorBlock">
                <div className="w-100 h-100 flex flex-column justify-center">
                  <p className="michroma tracked-1 b ttu lh-extra white-90 center pb1">
                    login
                  </p>
                </div>
              </div>
            </button>
          </form>
          <Link
            to={{
              pathname: "/sign-up",
              state: {
                from:
                  this.props.location.state && this.props.location.state.from
              }
            }}
          >
            or create an account
          </Link>
        </div>
      </div>
    );
  }
}

export default Login;
