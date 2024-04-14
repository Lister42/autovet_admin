import { api } from "@/utils/api";
import { auth, clientConverter, firestore } from "@/utils/firebase";
import { useState } from "react";
import { useSendSignInLinkToEmail } from "react-firebase-hooks/auth";
import type { Dispatch, SetStateAction } from "react";
import { addDoc, collection, setDoc } from "firebase/firestore";
import { showNotification } from "@/utils/toastr";

const RegisterForm = ({
  email,
  setEmail,
}: {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
}) => {
  const [sendSignInLinkToEmail, sending, error] =
    useSendSignInLinkToEmail(auth);

  const client = api.intravet.client_email.useQuery(email);

  const actionCodeSettings = {
    url: "http://autovet.gcc.edu:8080/create-account",
    handleCodeInApp: true,
  };

  return (
    <div className="p-3">
      <h1 className="pb-2">Register a new user</h1>

      <div className="row flex gap-2">
        <div className="">
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            id="default-search"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            value={email}
            placeholder="Email"
            required={true}
          />
        </div>

        <button
          className="btn-primary"
          type="button"
          onClick={async () => {
            // const success = await sendSignInLinkToEmail(
            //   email,
            //   actionCodeSettings
            // );
            // if (success) {
            //   alert("Sent email");
            // }

            const ref = await addDoc(collection(firestore, "client"), {
              email: email,
            });

            const data = client.data?.client;
            if (!data) {
              alert("no data from intravet");
              showNotification("warning", "No user found in intravet");
            }

            try {
              await setDoc(ref.withConverter(clientConverter), {
                uid: "",
                intravet_id: data?.ID ?? "",
                account_no: data?.AccountNo ?? 0,
                first_name: data?.FirstName ?? "",
                last_name: data?.LastName ?? "",
                email: email,
                phone_number: "",
                DOB: new Date(),
                primary_address: `${data?.Street ?? ""} ${data?.Street2 ?? ""} ${
                  data?.City ?? ""
                } ${data?.State ?? ""} ${data?.Zip ?? ""}`,
                secondary_address: "",
                refferal: "",
                co_owner: "",
                co_owner_phone_number: "",
                employer: data?.CompanyName ?? "",
                trusted_persons: "",
                client_ref: ref,
              });
              if (data?.FirstName && data?.LastName) {
                showNotification(
                  "success",
                  `Registered ${data?.FirstName} ${data?.LastName} successfully.`
                );
              } else {
                showNotification("success", "Registered user.");
              }
            } catch (e) {
              showNotification("error", "Error adding user to firebase.");
            }

            alert("not sending an email because don't want to spam people");
          }}
        >
          <p className="px-3">Register</p>
        </button>
      </div>

      {error && <p>Error: {error.message}</p>}
      {error && error.message.includes("auth/missing-email") && (
        <p>Please enter an email</p>
      )}
      {error && error.message.includes("auth/invalid-email") && (
        <p>Please enter a valid email</p>
      )}
      {sending && <p>Sending...</p>}
    </div>
  );
};

const UserLookup = ({
  setEmail,
}: {
  setEmail: Dispatch<SetStateAction<string>>;
}) => {
  const [name, setName] = useState("");
  const { data } = api.intravet.clients_name.useQuery(name);

  return (
    <div className="h-screen w-1/4 flex-none flex-col border-r border-gray-800 p-3 shadow-xl">
      <ul className="menu">
        <h1 className="pb-2">User Lookup</h1>
        {/* Client Search */}
        <div className="relative mb-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
</svg>

          </div>
          <input
            type="search"
            onChange={(e) => setName(e.target.value)}
            id="default-search"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            value={name}
            placeholder="Search intravet clients"
            required={true}
          />
        </div>

        {/* List of clients */}
        {!!data && !!data.clients ? (
          data.clients.map((client) => (
            <li
              key={client.ID}
              className="rounded-md"
              onClick={() => {
                if (client.Email && client.Email.length > 0)
                  setEmail(client.Email);
              }}
            >
              <button className="btn-primary my-1 shadow-md">
                <div>
                  <p>{`${client.FirstName ?? ""} ${client.LastName ?? ""}`}</p>
                  <p>
                    <b>{client.Email ?? "No email on file"}</b>
                  </p>
                </div>
              </button>
            </li>
          ))
        ) : (
          <></>
        )}
      </ul>
    </div>
  );
};

const Register = () => {
  const [email, setEmail] = useState<string>("");
  return (
    <div className="flex h-screen flex-row">
      <UserLookup setEmail={setEmail} />
      <RegisterForm email={email} setEmail={setEmail} />
    </div>
  );
};

export default Register;
