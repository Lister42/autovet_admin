import { auth } from "@/utils/firebase";
import { useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { type SubmitHandler, useForm } from "react-hook-form";

type FormValues = {
  signupEmail: string;
  signupPassword: string;
  signupConfirmPassword: string;
};

/**
 * React Component for Signup Form
 * @returns Signup Form Component
 */
export default function SignupForm() {
  // useForm hook, see https://react-hook-form.com/api/useform
  const { register, handleSubmit } = useForm<FormValues>();
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // useCreateUserWithEmailAndPassword hook, see https://github.com/CSFrequency/react-firebase-hooks/tree/master/auth#usecreateuserwithemailandpassword
  const [createUserWithEmailAndPassword, user, userLoading, userError] =
    useCreateUserWithEmailAndPassword(auth);

  // Submit handler for useForm hook
  const onSignup: SubmitHandler<FormValues> = (data) => {
    console.log(data);
    setPasswordError(null);

    if (data.signupPassword !== data.signupConfirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // creates new user with email and password
    createUserWithEmailAndPassword(data.signupEmail, data.signupPassword)
      .then((userCredential) => {
        // Signed in
        if (userCredential) {
          const user = userCredential.user;
          console.log(user);
        }
      })
      .catch((error) => {
        console.log(error);
        // ..
      });
  };
  return (
    <div>

<div className="hero px-6 py-12 bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">AutoVet Admin</h1>
            <p className="py-6">Slippery Rock Veterinarian Hospital Curbside Manager</p>
          </div>
          <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
            <div className="card-body">
              <form onSubmit={handleSubmit(onSignup)}>
                <div className="form-control">
                  <label className="label" htmlFor="signupEmail">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    className="input-bordered input"
                    id="loginEmail"
                    type="email"
                    autoComplete="email"
                    // register hook, see https://react-hook-form.com/api/useform/register
                    {...register("signupEmail", { required: true })}
                    placeholder="Email address"
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="signupPassword">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    className="input-bordered input"
                    id="signupPassword"
                    type="password"
                    // register hook, see https://react-hook-form.com/api/useform/register
                    {...register("signupPassword", { required: true })}
                    placeholder="Password"
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="signupConfirmPassword">
                    <span className="label-text">Confirm Password</span>
                  </label>
                  <input
                    className="input-bordered input"
                    id="signupConfirmPassword"
                    type="password"
                    // register hook, see https://react-hook-form.com/api/useform/register
                    {...register("signupConfirmPassword", { required: true })}
                    placeholder="Confirm password"
                  />
                </div>
                <div className="form-control mt-6">
                  <button type="submit" className="btn btn-primary">Login</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* <p className="">Create new account</p>
      <form onSubmit={handleSubmit(onSignup)}>
        <label className="sr-only" htmlFor="signupEmail">
          Email
        </label>
        <input
          className="input-bordered input"
          id="signupEmail"
          type="email"
          autoComplete="email"
          // register hook, see https://react-hook-form.com/api/useform/register
          {...register("signupEmail", { required: true })}
          placeholder="Email address"
        />

        <label className="sr-only" htmlFor="signupPassword">
          Password
        </label>
        <input
          className="input-bordered input"
          id="signupPassword"
          type="password"
          // register hook, see https://react-hook-form.com/api/useform/register
          {...register("signupPassword", { required: true })}
          placeholder="Password"
        />

        <label className="sr-only" htmlFor="signupConfirmPassword">
          Confirm password
        </label>
        <input
          className="input-bordered input"
          id="signupConfirmPassword"
          type="password"
          // register hook, see https://react-hook-form.com/api/useform/register
          {...register("signupConfirmPassword", { required: true })}
          placeholder="Confirm password"
        />

        <button type="submit" className="btn-primary btn">
          Sign Up
        </button>
      </form> */}

      {userLoading && <progress className="progress progress-primary w-full"></progress>}
      {passwordError && <p>{passwordError}</p>}

      {userError && userError.code === "auth/weak-password" && (
        <p>Password must be at least 6 characters</p>
      )}
      {userError && userError.code === "auth/invalid-email" && (
        <p>Please enter a valid email</p>
      )}
      {userError && userError.code === "auth/email-already-in-use" && (
        <p>Email already in use, please try again</p>
      )}
      {user && (
        <div>
          <p>Signed Up User: {user.user.email}</p>
        </div>
      )}
    </div>
  );
}
