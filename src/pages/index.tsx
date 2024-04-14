import Appointments from "@/components/appointments";
import Clients from "@/components/clients";
import SignupForm from "@/components/signupForm"
import { useEffect, useState } from "react";
import { auth, firestore } from "@/utils/firebase";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import router from "next/router";
import Register from "@/components/register";
import { useCollectionDataOnce } from "react-firebase-hooks/firestore";
import { query, collection } from "firebase/firestore";
import { adminConverter } from "@/utils/firebase";

const redirect = () => {
  router
    .push("/login")
    .then((success) => {
      if (!success) console.log(`redirect failed`);
    })
    .catch((error) => console.log(error));
  return <div></div>;
};

export default function Landing() {
  const [value, setValue] = useState(0);
  const [user, userLoading, userError] = useAuthState(auth);

  const [admins, loading_admins] = useCollectionDataOnce(
    query(collection(firestore, "admins").withConverter(adminConverter))
  );
  const [signOut] = useSignOut(auth);
  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch("/login").catch((error) => console.log(error));
  }, []);

  if (userLoading || loading_admins) {
    return <div></div>;
  }

  if (userError) {
    return <div>Error loading: {userError.message}</div>;
  }

  // If user is not logged in, redirect to login page
  if (!userLoading) {
    // Redirect to login page
    if (!user) return redirect();

    if (admins && !admins.map((x) => x.uid).includes(user.uid)) {
      // Redirect to login page
      return redirect();
    }
  }

  return (
    <div className="">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
      <div
        className="border-bottom navbar flex justify-stretch bg-neutral p-3 shadow-lg"
        aria-label="Manage your account"
      >
        <div className="navbar-start">
          <div className="items-center">
            <h2 className="px-3 text-center">
              AutoVet <br /> Administrator
            </h2>
          </div>

          <div className="tabs">
            <div
              className={
                "tab-bordered tab tab-lg" + (value == 0 ? " tab-active" : "")
              }
              onClick={() => setValue(0)}
            >
              Appointments
            </div>
            <div
              className={
                "tab-bordered tab tab-lg" + (value == 1 ? " tab-active" : "")
              }
              onClick={() => setValue(1)}
            >
              Clients
            </div>
            <div
              className={
                "tab-bordered tab tab-lg" + (value == 2 ? " tab-active" : "")
              }
              onClick={() => setValue(2)}
            >
              Register
            </div>
            <div
              className={
                "tab-bordered tab tab-lg" + (value == 3 ? " tab-active" : "")
              }
              onClick={() => setValue(3)}
            >
              Sign Up
            </div>
          </div>
        </div>
        <div className="navbar-end">
          <button type="button" className="btn-accent btn" onClick={async () => {
            await signOut();
            redirect();
          }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className={`${value ===3 ? "": "h-screen"} pb-6 pr-3`}>
        {value === 0 && <Appointments />}
        {value === 1 && <Clients />}
        {value === 2 && <Register />}
        {value === 3 && <SignupForm />}
      </div>
    </div>
  );
}
