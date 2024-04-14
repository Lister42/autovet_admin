import React, { useState } from "react";
import type { ClientType } from "@/utils/types";
import { useCollection } from "react-firebase-hooks/firestore";
import {
  doc,
  collection,
  query,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import {
  appointmentConverter,
  firestore,
  petConverter,
  storage,
} from "@/utils/firebase";
import { useCollectionData } from "react-firebase-hooks/firestore";
import AppointmentDetails from "./appointmentDetails";
import PetDetails from "./petDetails";
import Avatar from "@/components/avatar";
import { formatPhoneNumber } from "@/utils/format";
import { useDownloadURL } from "react-firebase-hooks/storage";
import { ref as storageRef } from "firebase/storage";

export default function ClientDetails(client: ClientType) {
  const [clientChanges] = useCollection(
    query(collection(firestore, "profile_data"), where("uid", "==", client.uid))
  );

  const clientChangeRef = clientChanges != null ? clientChanges.docs[0] : null;

  const clientChange = clientChangeRef ? clientChangeRef.data() : null;

  const [pets, p_loading, p_error] = useCollectionData(
    query(
      collection(firestore, "pets").withConverter(petConverter),
      where("intravet_client_id", "==", client.intravet_id)
    ),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const [apps, a_loading, a_error] = useCollectionData(
    query(
      collection(firestore, "appointment").withConverter(appointmentConverter),
      where("intravet_client_id", "==", client.intravet_id)
    ),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const client_storage_ref = storageRef(
    storage,
    client ? "images/" + client.uid : "default.png"
  );

  const [client_image_url, client_image_loading, client_image_error] =
    useDownloadURL(client_storage_ref);

  const futureApps = apps?.filter((app) => app.status != "closed");
  const pastApps = apps?.filter((app) => app.status == "closed");

  async function AcceptChanges() {
    //firebase.firestore().collection('client').doc(client.uid)
    console.log(client);

    await updateDoc(client.client_ref, {
      first_name: clientChange
        ? (clientChange.first_name as string)
        : client.first_name,
      last_name: clientChange
        ? (clientChange.last_name as string)
        : client.last_name,
      co_owner: clientChange
        ? (clientChange.co_owner as string)
        : client.co_owner,
      phone_number: clientChange
        ? (clientChange.phone_number as number)
        : client.phone_number,
      email: clientChange ? (clientChange.email as string) : client.email,
      primary_address: clientChange
        ? (clientChange.primary_address as string)
        : client.primary_address,
      secondary_address: clientChange
        ? (clientChange.secondary_address as string)
        : client.secondary_address,
      trusted_persons: clientChange
        ? (clientChange.trusted_persons as string)
        : client.trusted_persons,
      employer: clientChange
        ? (clientChange.employer as string)
        : client.employer,
    });

    if (clientChange) {
      console.log(clientChange);
    }
    await deleteChanges()
      .catch(() => console.log("Cannot delete doc."))
      .then(() => console.log("Try again."));
  }

  async function deleteChanges() {
    if (clientChangeRef) {
      await deleteDoc(doc(firestore, "profile_data", clientChangeRef.id))
        .catch(() => console.log("Cannot delete doc."))
        .then(() => console.log("Try again."));
    }
  }

  const [apptIndex, setApptIndex] = useState(-1);
  const [petIndex, setPetIndex] = useState(-1);

  const [appId, setAppId] = useState("");
  const [petId, setPetId] = useState("");

  function clickApp(aid: string) {
    // TODO: Set AppointmentDetails component to display selected guy
    if (apps != undefined) {
      const idx = apps.findIndex((x) => x.appointment_id === aid);
      if (idx > -1) {
        setApptIndex(idx);
        return;
      }
    }
  }

  function clickPet(pid: string) {
    // TODO: Set AppointmentDetails component to display selected guy
    if (pets != undefined) {
      const idx = pets.findIndex((x) => x.pet_id === pid);
      if (idx > -1) {
        setPetIndex(idx);
        return;
      }
    }
  }

  const Client_details = () => {
    return (
      <div className="">
        <div>
          {/* TODO: load in profile picture */}
          {!client_image_loading && !client_image_error && client_image_url ? (
            <Avatar image={client_image_url} />
          ) : (
            <Avatar image={"/images/profile_icon.png"} />
          )}

          {client.uid != null ? (
            <div className="inline-block pl-2">
              <p className="text-2xl">
                <b>
                  {client.first_name} {client.last_name}
                </b>
              </p>
              <p className="text-md">
                {formatPhoneNumber(client.phone_number)}
              </p>
              <p className="text-md">{client.email}</p>
            </div>
          ) : (
            <b>Client Details</b>
          )}
        </div>

        <hr className="mt-2"></hr>

        <div className="my-2 grid grid-cols-2">
          {/* Client stuff */}
          <div className="">
            {client.uid != null ? (
              <div className="" key={client.uid}>
                <p>
                  <b>Co-Owner:</b>{" "}
                  {client.co_owner != "" && client.co_owner != null
                    ? client.co_owner
                    : "N/A"}
                  <b> | </b>
                  {client.co_owner_phone_number != "" &&
                  client.co_owner_phone_number != null
                    ? formatPhoneNumber(client.co_owner_phone_number)
                    : "N/A"}
                </p>
                <p>
                  <b>Primary Address:</b> {client.primary_address}
                </p>
                <p>
                  <b>Secondary Address:</b>{" "}
                  {client.secondary_address != "" &&
                  client.secondary_address != null
                    ? client.secondary_address
                    : "N/A"}
                </p>
                <p>
                  <b>DOB:</b>{" "}
                  {client.DOB ? client.DOB.toLocaleDateString() : "N/A"}
                </p>
                <p>
                  <b>{`Trusted Person(s):`}</b>{" "}
                  {client.trusted_persons ?? "N/A"}
                </p>

                {clientChange && (
                  <div>
                    <div className="mt-2 rounded-sm border p-3 shadow-md">
                      {clientChange.first_name && clientChange.last_name ? (
                        <p>
                          Primary Owner:{" "}
                          {clientChange.first_name == client.first_name &&
                          clientChange.last_name == client.last_name ? (
                            `${clientChange.first_name as string} ${
                              clientChange.last_name as string
                            }`
                          ) : (
                            <b className="text-red-500">
                              {clientChange?.first_name}{" "}
                              {clientChange?.last_name}
                            </b>
                          )}{" "}
                          |
                          {clientChange?.phone_number != client.phone_number ? (
                            <b className="text-red-500">
                              {" "}
                              {clientChange?.phone_number}{" "}
                            </b>
                          ) : (
                            client?.phone_number
                          )}
                        </p>
                      ) : (
                        ""
                      )}
                      {clientChange.co_owner ? (
                        <p>
                          Co-Owner:{" "}
                          {clientChange.co_owner != client.co_owner ? (
                            <b className="text-red-500">
                              {" "}
                              {clientChange?.co_owner}
                            </b>
                          ) : (
                            clientChange.co_owner
                          )}
                        </p>
                      ) : (
                        ""
                      )}{" "}
                      {clientChange.primary_address ? (
                        <p>
                          Primary Address:{" "}
                          {clientChange.primary_address !=
                          client.primary_address ? (
                            <b className="text-red-500">
                              {clientChange?.primary_address}
                            </b>
                          ) : (
                            client.primary_address
                          )}
                        </p>
                      ) : (
                        ""
                      )}
                      {clientChange.secondary_address ? (
                        <p>
                          Secondary Address:{" "}
                          {clientChange.secondary_address !=
                          client.secondary_address ? (
                            <b className="text-red-500">
                              {clientChange?.secondary_address}
                            </b>
                          ) : (
                            client.secondary_address
                          )}
                        </p>
                      ) : (
                        ""
                      )}
                      {clientChange.email ? (
                        <p>
                          E-Mail:{" "}
                          {clientChange.email != client.email ? (
                            <b className="text-red-500">
                              {clientChange?.email}
                            </b>
                          ) : (
                            client.email
                          )}
                        </p>
                      ) : (
                        ""
                      )}
                      {clientChange.trusted_persons ? (
                        <p>
                          Trusted Persons:{" "}
                          {clientChange.trusted_persons !=
                          client.trusted_persons ? (
                            <b className="text-red-500">
                              {clientChange?.trusted_persons}
                            </b>
                          ) : (
                            client.trusted_persons
                          )}
                        </p>
                      ) : (
                        ""
                      )}
                      {clientChange.employer ? (
                        <p>
                          Employer:{" "}
                          {clientChange.employer != client.employer ? (
                            <b className="text-red-500">
                              {clientChange?.employer}
                            </b>
                          ) : (
                            client.employer
                          )}
                        </p>
                      ) : (
                        ""
                      )}
                      <p></p>
                    </div>
                    <button
                      className="btn-primary btn mr-2"
                      onClick={() => AcceptChanges()}
                    >
                      Accept Changes
                    </button>
                    <button
                      className="btn-primary btn"
                      onClick={() => deleteChanges()}
                    >
                      Deny Changes
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p>Select a client</p>
            )}
          </div>

          {/* Pets */}
          <div className="col-span-1">
            <div
              tabIndex={0}
              className="collapse-arrow rounded-box collapse border border-base-300 bg-neutral shadow-lg"
            >
              <input type="checkbox" className="peer" />
              <div className="btn-neutral collapse-title btn text-xl font-medium">
                <h1 className="text-lg">
                  <b>Pets</b>
                </h1>
              </div>
              <div className="collapse-content">
                <ul className="menu">
                  {p_error && <strong>Error: {JSON.stringify(p_error)}</strong>}
                  {p_loading && (
                    <progress className="progress progress-primary w-full"></progress>
                  )}
                  {pets && (
                    <div className="">
                      {pets.length > 0 ? (
                        pets.map((pet) => (
                          <li
                            className="my-1 cursor-pointer rounded-md border border-gray-800 shadow-md hover:scale-[0.99]"
                            key={pet.pet_id}
                            onClick={() => setPetId(pet.pet_id)}
                            //onClick={() => clickPet(pet.pet_id)} // Take to pet page
                          >
                            <button className="btn-primary btn">
                              {pet.name} | {pet.species} : {pet.breed}
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm">No pets</p>
                      )}
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <hr className="pb-2"></hr>

        {a_error && <strong>Error: {JSON.stringify(a_error)}</strong>}
        {a_loading && (
          <progress className="progress progress-primary w-full"></progress>
        )}

        {/* Future Appointments */}
        {futureApps && (
          <>
            <div
              tabIndex={0}
              className="collapse-arrow collapse-open rounded-box collapse mb-2 border border-base-300 bg-neutral shadow-lg"
            >
              <input type="checkbox" className="peer" />
              <div className="btn-neutral collapse-title btn text-xl font-medium">
                <h1 className="pb-1 text-lg">
                  <b>Upcoming Appointments</b>
                </h1>
              </div>
              <div className="collapse-content">
                <ul className="menu">
                  {futureApps.length > 0 ? (
                    futureApps.map((app) => (
                      <li
                        key={app.appointment_id}
                        className="my-1 cursor-pointer rounded-md border border-gray-800 shadow-md hover:scale-[0.99]"
                        onClick={() => setAppId(app.appointment_id)}
                        //onClick={() => clickApp(app.appointment_id)}
                      >
                        <button className="btn-primary btn">
                          {app.reason} | {app.date.toLocaleDateString()}
                        </button>
                      </li>
                    ))
                  ) : (
                    <div className="text-sm">No Upcoming Appointments</div>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Past Appointments */}
        {pastApps && (
          <>
            <div
              tabIndex={0}
              className="collapse-arrow rounded-box collapse mb-3 border border-base-300 bg-neutral shadow-lg"
            >
              <input type="checkbox" className="peer" />
              <div className="btn-neutral collapse-title btn text-xl font-medium">
                <h1 className="pb-1 text-lg">
                  <b>Past Appointments</b>
                </h1>
              </div>
              <div className="collapse-content">
                <ul className="menu">
                  {pastApps.length > 0 ? (
                    pastApps.map((app) => (
                      <li
                        key={app.appointment_id}
                        className="my-1 cursor-pointer rounded-md border border-gray-800 shadow-md hover:scale-[0.99]"
                        onClick={() => clickApp(app.appointment_id)}
                        //onClick={() => clickApp(app.appointment_id)}
                      >
                        <button className="btn-primary btn">
                          {app.reason} | {app.date.toLocaleDateString()}
                        </button>
                      </li>
                    ))
                  ) : (
                    <div className="text-sm">No Past Appointments</div>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const Switcharoo = () => {
    if (apps) {
      const appIdx = apps.findIndex((x) => x.appointment_id === appId);
      //const b = apps[apptIndex];
      const a = apps[appIdx];
      if (a != undefined) {
        return (
          <div className="">
            <button
              className="delay-50 btn-primary mb-2 rounded-md border border-gray-800 px-3 py-1 shadow-md transition duration-300 ease-in-out hover:scale-[0.98]"
              //onClick={() => setApptIndex(-1)}
              onClick={() => setAppId("")}
            >
              <b>{`< Back To ${client.first_name} ${client.last_name}`}</b>
            </button>
            <AppointmentDetails {...a} />
          </div>
        );
      }
    }
    if (pets) {
      const petIdx = pets.findIndex((x) => x.pet_id === petId);
      const p = pets[petIdx];
      if (p != undefined) {
        return (
          <div className="">
            <button
              className="delay-50 btn-primary mb-2 rounded-md border border-gray-800 px-3 py-1 shadow-md transition duration-300 ease-in-out hover:scale-[0.98]"
              onClick={() => setPetId("")}
              //onClick={() => setPetIndex(-1)}
            >
              <b>{`< Back To ${client.first_name} ${client.last_name}`}</b>
            </button>
            <PetDetails {...p} />
          </div>
        );
      }
    }
    return <Client_details />;
  };

  return <Switcharoo />;
}
