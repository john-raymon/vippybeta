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

/**
   * 1. on first submit, save all form date, init request to twilio with only phone number to send verification code to it
   * 2. if first step successful, set state hasInitVerif to true, display neccessary UI such different submit button,
   *    showing field for verification code, also showing resend code button, if not successful display errors
   * 3. on second submit, with verifcation code, make request to the CREATE users endpoint
   *    attempting to create the user with verification code, display errors if not successful
        if user wants to verify with another number they will have to click a change number button and have the
        the ui change accordingly to init proper request on future submit
   * 4. if second submit successful, then user will be registered and proper state will be updated
   */
class UserRegister extends Component {
  constructor(props) {
    super(props);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.validate = this.validate.bind(this);
    this.resetErrorsState = this.resetErrorsState.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.sendOnBoardCode = this.sendOnBoardCode.bind(this);
    this.revertInitOfVerif = this.revertInitOfVerif.bind(this);
    this.state = {
      hasInitVerif: false,
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      zipCode: "",
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
      // since we created the allErrorsExampleName programatically by
      // interpolating, we have to reduce to know exact key to erase. A regex to match allErrors will be more efficient here
      // or simply creating an errors object in the state.
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
        <div className="w-100 w-50-l ph3-l mb4 mb0-l">
          {this.props.location.state &&
          this.props.location.state.from &&
          this.props.location.state.from.state.continueCheckout ? (
            <ListingLineItem
              boxTitle="Almost done! Create an account before checking out and reserving"
              listingId={this.props.location.state.from.state.listingId}
              userAgent={this.props.userAgent}
            />
          ) : (
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
          )}
        </div>
        <div className="registerComponent flex flex-column w-100 w-50-l">
          {hasInitVerif ? (
            <h1 className="michroma tracked lh-title white ttc f3 f2-ns pr4 mb2 mw6 mt0">
              {`Almost done ${
                prevValidatedUser.fullName.split(" ")[0]
              }, thank you for trying Vippy!`}
            </h1>
          ) : (
            <h1 className="michroma tracked lh-title white ttc f3 f2-ns pr4 mb2 mt0">
              easily register <br /> below
            </h1>
          )}
          {error && (
            <p className="michroma f6 tracked ttc yellow lh-copy o-70 pt3 pb3">
              {error}
            </p>
          )}
          {hasInitVerif && !error && (
            <p className="michroma f6 tracked ttc yellow o-70 pt3 pb2 lh-copy">
              We sent you a verification code, please enter it below.
            </p>
          )}
          <form
            className="registerComponent__form flex flex-column w-100 mt2"
            onChange={this.handleFormChange}
          >
            {hasInitVerif && (
              <Fragment>
                <div className="mb2 w-100">
                  <RegisterFormTextField
                    placeholder="Enter your verfication code"
                    type="text"
                    label="Code"
                    name="verificationCode"
                    value={this.state.verifcationCode}
                  />
                  <div className="flex flex-row items-center pt1">
                    <button
                      className="michroma outline-0 bn bg-transparent f8 white-90 o-60 pa0 tracked lh-title pointer"
                      onClick={this.revertInitOfVerif}
                    >
                      verify a different number
                    </button>
                    <p className="flex white-50 mh1 self-center pt1">|</p>
                    <button
                      className="michroma outline-0 bn bg-transparent f8 white-90 o-60 pa0 tracked lh-title pointer"
                      onClick={this.onFormSubmit}
                    >
                      resend code
                    </button>
                  </div>
                  {this.state.verificationCodeError && (
                    <p className="michroma f7 red o-60 pt1 tracked lh-copy">
                      {this.state.verificationCodeError}
                    </p>
                  )}
                </div>
                <button
                  className="vippyButton mt3 mb4 mw1 self-end dim"
                  onClick={e => this.onFormSubmit(e, true)}
                  type="submit"
                >
                  <div className="vippyButton__innerColorBlock">
                    <div className="w-100 h-100 flex flex-column justify-center">
                      <p className="michroma f8 tracked-1 b ttu lh-extra white-90 center pb1">
                        verify
                      </p>
                    </div>
                  </div>
                </button>
              </Fragment>
            )}
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
            {!hasInitVerif && ( // when this hasInitVerif is truthy we will then render the verify button above ^
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
            )}
          </form>
        </div>
      </div>
    );
  }
}

export default connect(
  null,
  { registerDispatch: registerDispatch() }
)(UserRegister);
