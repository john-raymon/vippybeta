import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import * as yup from "yup";
import {
  phoneNumber as phoneNumberRegExp,
  password as passwordRegExp,
  zipCode as zipCodeRegExp
} from "./../utils/regExp";

// Redux Actions
import { register as registerDispatch } from "./../state/actions/authActions";

// components
import RegisterFormTextField from "./FormField";
import ListingLineItem from "./ListingLineItem";

// svgs
import GlobeIcon from "../svgs/globe-icon-svg";

/**
   * 1. on first submit, save all form date, init request to twilio withonly phone number
   * 2. if first step successful, set state hasInitVerif to true, display neccessary UI such different submit button,
   *    showing field for verification code, also showing resend code button, if not successful display errors
   * 3. on second submit, with verifcation code, make request the CREATE users endpoint
   *    attempt to create user with verification code, display errors if not successful
        if user wants to verify with another number they will have to click a change number button and have the
        the ui change accordingly to init proper request on future submit
   * 4. if second submit successful, then user will be registered and proper state will be updated
   */
class VenueRegister extends Component {
  constructor(props) {
    super(props);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.validate = this.validate.bind(this);
    this.resetErrorsState = this.resetErrorsState.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.sendOnBoardCode = this.sendOnBoardCode.bind(this);
    this.verifyAndCreateUser = this.verifyAndCreateUser.bind(this);
    this.revertInitOfVerif = this.revertInitOfVerif.bind(this);
    this.state = {
      hasInitVerif: false,
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      verificationCode: "",
      error: ""
    };
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

  resetErrorsState() {
    const allErrors = Object.keys(this.state).reduce((allErrors, key) => {
      const allKeyChars = key.toLowerCase();
      if (allKeyChars.slice(-5) === "error") {
        allErrors[key] = undefined;
      }
      return allErrors;
    }, {});
    this.setState({
      error: "",
      ...allErrors
    });
  }

  verifyAndCreateUser(user) {
    return this.props.userAgent.create({
      ...user,
      verification_code: user.verificationCode,
      fullname: user.fullName,
      phonenumber: user.phoneNumber
    });
  }

  sendOnBoardCode(phoneNumber, email) {
    return this.props.userAgent.sendOnBoardCode(phoneNumber, email);
  }

  validate(user, continueRegistration) {
    const userSchema = yup.object().shape({
      email: yup
        .string()
        .email("Please enter a valid email")
        .required("Your email is required"),
      phoneNumber: yup
        .string()
        .matches(phoneNumberRegExp, {
          message: "Your phone must be a valid phone number"
        })
        .label("Phone number")
        .required("You must provide a phone number"),
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
        .required("You must confirm the password"),
      fullName: yup.string().required("Your full name is required"),
      zipCode: yup
        .string()
        .matches(zipCodeRegExp, {
          message: "Please enter a valid zip code"
        })
        .required("Please enter a zip code"),
      verificationCode: yup.string().when("$continueRegistration", {
        is: true,
        then: yup.string().required("Please enter your verification code"),
        otherwise: yup.string()
      })
    });
    return userSchema.validate(user, {
      abortEarly: false,
      context: { continueRegistration }
    });
  }

  handleFormChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  revertInitOfVerif() {
    this.setState({
      ...this.state,
      hasInitVerif: false
    });
  }

  onFormSubmit(e, continueRegistration = false) {
    e.preventDefault();
    this.resetErrorsState();
    const newUser = {
      email: this.state.email,
      phoneNumber: this.state.phoneNumber,
      password: this.state.password,
      confirmPassword: this.state.confirmPassword,
      fullName: this.state.fullName,
      zipCode: this.state.zipCode.trim(),
      verificationCode: this.state.verificationCode || ""
    };
    this.validate(newUser, continueRegistration)
      .then(validatedNewUser => {
        this.setState({
          ...this.state,
          prevValidatedUser: validatedNewUser
        });
        if (continueRegistration) {
          return this.props
            .registerDispatch(validatedNewUser, this.props.userAgent)
            .then(() => {
              this.props.setSnackbar(
                "Yay, your account was created successfully!"
              );
            });
        }
        return this.sendOnBoardCode(
          validatedNewUser.phoneNumber,
          validatedNewUser.email
        ).then(res => {
          if (res.success) {
            window.scrollTo(0, 0);
            return this.setState({
              ...this.state,
              hasInitVerif: true
            });
          } else {
            return Promise.reject({
              message:
                res.error ||
                "We are experiencing issues while attempting to send your number a verification. Please try a different number or try again later."
            });
          }
        });
      })
      .catch(error => {
        // catch validation errors, and map them path/state name
        if (error.name === "ValidationError") {
          let allOtherErrors = {};
          let errorsByPath = {};
          if (!error.inner) {
            allOtherErrors = Object.keys(error.errors).reduce(
              (allOtherErrors, key) => {
                allOtherErrors[`${key}Error`] = error.errors[key];
                return allOtherErrors;
              },
              {}
            );
          } else {
            errorsByPath = error.inner.reduce((errorsByPath, error) => {
              errorsByPath[`${error.path}Error`] = error.message;
              return errorsByPath;
            }, {});
          }
          return this.setState({
            ...this.state,
            ...allOtherErrors,
            ...errorsByPath
          });
        }
        return this.setState({
          error: error.message || error.error
        });
      });
  }
  render() {
    const {
      error,
      hasInitVerif,
      prevValidatedUser = {
        fullName: "Nova Rae"
      }
    } = this.state;
    return (
      <div className="flex flex-column flex-row-l mw8 center pv4 ph1">
        <div className="registerComponent flex flex-column w-100">
          <h1 className="michroma tracked lh-title white tw-text-2xl lg:tw-text-4xl f2-ns tw-text-center mb2 mt0">
            Optimize the reservation experience for your events. Register your
            venue.
          </h1>

          {error && (
            <p className="michroma f6 tracked ttc yellow lh-copy o-70 pt3 pb3">
              {error}
            </p>
          )}

          <div className="tw-flex tw-flex-col md:tw-flex-row tw-py-6">
            <form
              className="registerComponent__form flex flex-column tw-w-full md:tw-w-6/12 mt2"
              onChange={this.handleFormChange}
            >
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="What's your email address?"
                  type="email"
                  label="Email"
                  name="email"
                  value={this.state.email}
                />

                {this.state.emailError && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {this.state.emailError}
                  </p>
                )}
              </div>

              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Enter your Phone Number"
                  type="text"
                  label="Phone Number"
                  name="phoneNumber"
                  className={`${hasInitVerif ? "o-30" : ""}`}
                  value={this.state.phoneNumber}
                  disabled={hasInitVerif}
                />

                {hasInitVerif && (
                  <div className="flex flex-row items-center pt2">
                    <button
                      className="michroma outline-0 bn bg-transparent f8 white-90 o-60 pa0 tracked lh-title pointer"
                      onClick={this.revertInitOfVerif}
                    >
                      verify a different number
                    </button>
                  </div>
                )}

                {this.state.phoneNumberError && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {this.state.phoneNumberError}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Enter Your Zip Code"
                  type="text"
                  label="Zip Code"
                  name="zipCode"
                  value={this.state.zipCode}
                />
                {this.state.zipCodeError && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {this.state.zipCodeError}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Create a password"
                  type="password"
                  label="Password"
                  name="password"
                  value={this.state.password}
                />
                {this.state.passwordError && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {this.state.passwordError}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Confirm your password"
                  type="password"
                  label="Confirm Password"
                  name="confirmPassword"
                  value={this.state.confirmPassword}
                />
                {this.state.confirmPasswordError && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {this.state.confirmPasswordError}
                  </p>
                )}
              </div>
              <div className="mb3 w-100">
                <RegisterFormTextField
                  placeholder="Ex. Nova Rae"
                  type="text"
                  label="Full Name"
                  name="fullName"
                  value={this.state.fullName}
                />
                {this.state.fullNameError && (
                  <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                    {this.state.fullNameError}
                  </p>
                )}
              </div>
              {!hasInitVerif && (
                <button
                  className="vippyButton mt4 mw1 self-end dim"
                  onClick={this.onFormSubmit}
                  type="submit"
                >
                  <div className="vippyButton__innerColorBlock">
                    <div className="w-100 h-100 flex flex-column justify-center">
                      <p className="michroma f8 tracked-1 b ttu lh-extra white-90 center pb1">
                        sign up
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </form>
            <div className="tw-flex tw-justify-end tw-items-center tw-flex-grow tw-px-6 tw-order-first md:tw-order-none">
              <div className="tw-flex tw-flex-col tw-w-full tw-items-end">
                <div className="tw-flex tw-justify-between tw-items-center tw-max-w-sm">
                  <div class="tw-w-10 tw-max-w-xs">
                    <GlobeIcon />
                  </div>
                  <p className="tw-w-48 tw-text-sm tw-text-right tw-text-white tw-leading-relaxed tw-tracking-wider">
                    We don’t charge anything up-front
                  </p>
                </div>
                <p className="tw-w-full tw-text-xs tw-text-gray-600 tw-mt-2 tw-text-right tw-leading-relaxed md:tw-max-w-sm lg:tw-max-md">
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

export default connect(
  null,
  { registerDispatch }
)(VenueRegister);
