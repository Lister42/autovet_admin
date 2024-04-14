import { adminConverter, auth, firestore } from "@/utils/firebase";
import { query, collection } from "firebase/firestore";
import router from "next/router";
import { useEffect, useState } from "react";
import {
  useSendPasswordResetEmail,
  useSignInWithEmailAndPassword,
} from "react-firebase-hooks/auth";
import { useCollectionDataOnce } from "react-firebase-hooks/firestore";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [admin_error, set_admin_error] = useState<string>("");

  const [admins] = useCollectionDataOnce(
    query(collection(firestore, "admins").withConverter(adminConverter))
  );

  // useSignInWithEmailAndPassword hook, see https://github.com/CSFrequency/react-firebase-hooks/tree/master/auth#usesigninwithemailandpassword
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const [sendPasswordResetEmail, resetLoading, resetError] =
    useSendPasswordResetEmail(auth);

  // Submit handler for useForm hook
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(email, password);
      if (userCredential) {
        if (
          admins &&
          !admins.map((x) => x.uid).includes(userCredential.user.uid)
        ) {
          set_admin_error("This account is not an admin account");
          return;
        }
        const result = await router.push("/");
        if (!result) console.log("error pushing to landing page");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    router.prefetch("/").catch((err) => console.log(err));
  }, []);

  return (
    <div className="flex h-screen">
      <div className="hero bg-base-200 px-6 py-12">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">AutoVet Admin</h1>
            <p className="py-6">
              Slippery Rock Veterinarian Hospital Curbside Manager
            </p>
          </div>
          <div className="card w-full max-w-sm flex-shrink-0 bg-base-100 shadow-2xl">
            <div className="card-body">
              <form onSubmit={onSubmit}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    className="input-bordered input"
                    id="loginEmail"
                    type="email"
                    autoComplete="email"
                    required={true}
                    placeholder="Email address"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    className="input-bordered input"
                    id="loginPassword"
                    type="password"
                    required={true}
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label className="label">
                    <a
                      onClick={() =>
                        sendPasswordResetEmail(email, {
                          url: "http://autovet.gcc.edu:3000",
                        })
                      }
                      className="link-hover label-text-alt link"
                    >
                      Forgot password?
                    </a>
                  </label>
                </div>
                <div className="form-control mt-6">
                  <button type="submit" className="btn-primary btn">
                    Login
                  </button>
                </div>
              </form>
              {(loading || resetLoading) && (
                <progress className="progress progress-primary w-full"></progress>
              )}

              {/* jsx that will check if the type of resetError is AuthError and then display resetError.code */}

              {resetError &&
                resetError.message.includes("auth/invalid-email") && (
                  <p>Email not found</p>
                )}
              {resetError &&
                resetError.message.includes("auth/missing-email") && (
                  <p>Please enter an email</p>
                )}

              {admin_error && <p>{admin_error}</p>}

              {/* {resetError && resetError typeof AuthError && resetError.code  === 'auth/' && <p>{resetError.message}</p>} */}
              {error && error.code === "auth/user-not-found" && (
                <p>Email not found</p>
              )}
              {error && error.code === "auth/wrong-password" && (
                <p>Wrong password, please try again.</p>
              )}
              {user && !admin_error && (
                <div>
                  <p>Signed In User: {user.user.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
