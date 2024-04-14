import {
  useCollection,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import type {
  AdminType,
  AppointmentType,
  ChatInfo,
  MessageType,
} from "@/utils/types";
import { Status } from "@/utils/types";
import { Timestamp, addDoc, getDocs } from "firebase/firestore";
import {
  collection,
  deleteDoc,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { ref as storageRef } from "firebase/storage";
import {
  firestore,
  clientConverter,
  petConverter,
  messageConverter,
  appointmentDataConverter,
  storage,
} from "@/utils/firebase";
import InvoiceInfo from "@/components/invoiceinfo";
import { useEffect, useState } from "react";
import ChatBox from "./chatBox";
import Avatar from "@/components/avatar";
import { formatPhoneNumber } from "@/utils/format";
import { showNotification } from "@/utils/toastr";
import {
  appointmentNotificationList,
  currentAdmin,
  messagesSavedToDB,
  notificationChannelInstance,
  observedAppointmentChannels,
  processNotification,
  pusherInstance,
} from "@/utils/pusherUtil";
import type { Channel } from "pusher-js";
import { useDownloadURL } from "react-firebase-hooks/storage";

export default function AppointmentDetails(appointment: AppointmentType) {
  // useDocumentDataOnce is a hook that fetches a document once and returns the data
  const [client, client_loading, client_error] = useDocumentData(
    appointment.client.withConverter(clientConverter)
  );
  const [pet] =
    useDocumentData(appointment.pet?.withConverter(petConverter));

  console.log("ON Appointment detail mount, this is pet:", pet);
  console.log("and client: ", client);

  const [change, updatePage] = useState(false);
  const [curApptID, setCurApptID] = useState("");
  const [notifUpdater, updateNotifUpdater] = useState(Date.now());
  const [notificationChannel, setNotificationChannel] = useState<Channel>();
  const [channel, setChannel] = useState<Channel>();
  const [admin, setAdmin] = useState<AdminType>();
  const [appointmentChanges, loading_changes] = useCollection(
    query(
      collection(firestore, "checkin_data").withConverter(
        appointmentDataConverter
      ),
      where("appointment_ref", "==", appointment.appointment_ref)
    )
  );
  //Just some fancy stuff to make sure we have the appointment change ref for check in data
  const appointmentChangeRef =
    appointmentChanges != null ? appointmentChanges.docs[0] : null;
  const appointmentChange = appointmentChangeRef
    ? appointmentChangeRef.data()
    : null;

  const [newSpot, setNewSpot] = useState(appointmentChange?.spot ?? "");
  const [newNotes, setNewNotes] = useState(appointmentChange?.notes ?? "");
  const [newName, setNewName] = useState(appointmentChange?.name ?? "");
  const [newPhone, setNewPhone] = useState(
    appointmentChange?.primary_phone ?? ""
  );
  const [newCoowner, setNewCoowner] = useState(
    appointmentChange?.coowner ?? ""
  );
  const [newCoPhone, setNewCoPhone] = useState(
    appointmentChange?.coowner_phone ?? ""
  );
  const [newEmail, setNewEmail] = useState(appointmentChange?.email ?? "");
  const [newAddress, setNewAddress] = useState(
    appointmentChange?.primary_address ?? ""
  );
  const [new2Address, setNew2Address] = useState(
    appointmentChange?.secondary_address ?? ""
  );
  const [newEmployer, setNewEmployer] = useState(
    appointmentChange?.employer ?? ""
  );
  // const [newReason, setNewReason] = useState((appointmentChange?.reason) ?? "");

  useEffect(() => {
    if (appointmentChanges) {
      const ref =
        appointmentChanges != null ? appointmentChanges.docs[0] : null;
      const change = ref
        ? ref.data()
        : null;


      if (change) {

        console.log("loaded");

        setNewSpot(change.spot ?? "");
        setNewNotes(change?.notes ?? "");
        setNewName(change.name ?? "");
        setNewPhone(
          change.primary_phone ?? ""
        );
        setNewCoowner(
          change.coowner ?? ""
        );
        setNewCoPhone(
          change.coowner_phone ?? ""
        );
        setNewEmail(change.email ?? "");
        setNewAddress(
          change.primary_address ?? ""
        );
        setNew2Address(
          change.secondary_address ?? ""
        );
        setNewEmployer(
          change.employer ?? ""
        );
      }
      
    }
  }, [appointmentChanges]);

  const storage_ref = storageRef(
    storage,
    "images/pets/" + (pet ? pet.pet_ref.id : "paw-icon-light.png")
  );

  const [image_url, image_loading, image_error] = useDownloadURL(storage_ref);

  const client_storage_ref = storageRef(
    storage,
    client ? "images/" + client.uid : "default.png"
  );

  const [client_image_url, client_image_loading, client_image_error] =
    useDownloadURL(client_storage_ref);
  //#DEVELOPMENT#: hard constraint to control whether messages get added to the database
  const addMessagesToDB = messagesSavedToDB;

  useEffect(() => {
    //If user hasn't even viewed the appointment
    if (curApptID) {
      if (!(curApptID in observedAppointmentChannels)) {
        //So appointment notifications and message notifications should only be updated
        appointmentNotificationList[curApptID] = {
          apptID: curApptID,
          appointmentNotifications:
            (appointmentNotificationList[curApptID]?.appointmentNotifications ??
              0) + 1,
          messageNotifications:
            (appointmentNotificationList[curApptID]?.messageNotifications ??
              0) + 1,
          hasCompletedProcessStep: false,
        };
        updateNotifUpdater(Date.now());
        //do stuff to make sure the new messages have red icons beside them
      } //If user has viewed appointment at some point but left
      else if (
        curApptID in observedAppointmentChannels &&
        !observedAppointmentChannels[curApptID]
      ) {
        appointmentNotificationList[curApptID] = {
          apptID: curApptID,
          appointmentNotifications:
            (appointmentNotificationList[curApptID]?.appointmentNotifications ??
              0) + 1,
          messageNotifications:
            (appointmentNotificationList[curApptID]?.messageNotifications ??
              0) + 1,
          hasCompletedProcessStep: false,
        };
        updateNotifUpdater(Date.now());
        //do stuff to make sure the new messages have red icons beside them
      }
      //Then user is currently viewing the appointment that received the notification
      else if (observedAppointmentChannels[curApptID]) {
        appointmentNotificationList[curApptID] = {
          apptID: curApptID,
          appointmentNotifications:
            appointmentNotificationList[curApptID]?.appointmentNotifications ??
            0,
          messageNotifications:
            appointmentNotificationList[curApptID]?.messageNotifications ?? 0,
          hasCompletedProcessStep: false,
        };
        if (appointment.appointment_id in processNotification) {
          //If it should notify the admin that something has happened
          if (processNotification[appointment.appointment_id]) {
            if (appointment.status == Status.Waiting)
              showNotification("success", "Client submitted check in form");
            if (appointment.status == Status.CheckedOut)
              showNotification("success", "Client has payed invoice");
            processNotification[appointment.appointment_id] = false;
          }
        } else {
          console.log("appointment has had no updated processes on it");
        }
        updateNotifUpdater(Date.now());
        //If we want then, this logic allows us to do special effects on messages as they appear. Might need to do some fancy work tho to talk with chatBox.
      }
    } else {
      console.log("Appointment ID was undefined", curApptID);
    }
  }, [appointment.appointment_id, appointment.status, change, curApptID]);

  useEffect(() => {
    if (appointment.appointment_id in processNotification) {
      //If it should notify the admin that something has happened
      if (processNotification[appointment.appointment_id]) {
        if (appointment.status == Status.Waiting)
          showNotification("success", "Client submitted check in form");
        if (appointment.status == Status.CheckedOut)
          showNotification("success", "Client has payed invoice");

        processNotification[appointment.appointment_id] = false;
      }
    } else {
      console.log("appointment has had no updated processes on it");
    }
    async function loadChannel() {
      const nChannel = await notificationChannelInstance;
      setNotificationChannel(nChannel);
      nChannel.bind("client-create-process-notification", (apptID: string) => {
        if (apptID == appointment.appointment_id) {
          //Will show toast when loading appointment details
          processNotification[apptID] = true;
          updatePage(!change);
          setCurApptID(apptID);
        }
      });

      const pusher = await pusherInstance;
      const result = pusher.subscribe(
        "presence-client-" + appointment.appointment_id
      );
      setChannel(result);
    }
    void loadChannel();
    async function loadAdmin() {
      const result = await currentAdmin;
      setAdmin(result);
    }
    void loadAdmin();
  }, [appointment.appointment_id, appointment.status, change]);

  async function AcceptChanges() {
    try {
      await updateDoc(appointment.appointment_ref, {
        // reason: newReason != "" ? newReason : appointment.reason,
        notes: newNotes != "" ? newNotes : appointment.notes,
        spot_number: newSpot != "" ? newSpot : appointment.spot_number,
      });

      if (client) {
        await updateDoc(client?.client_ref, {
          first_name:
            newName != "" && newName.split(" ")[0] != ""
              ? newName.split(" ")[0]
              : client.first_name,
          last_name:
            newName != "" && newName.split(" ")[1] != ""
              ? newName.split(" ")[1]
              : client.last_name,
          email: newEmail != "" ? newEmail : client.email,
          phone_number: newPhone != "" ? newPhone : client.phone_number,
          employer: newEmployer != "" ? newEmployer : client.employer,
          secondary_address:
            new2Address != "" ? new2Address : client.secondary_address,
          primary_address:
            newAddress != "" ? newAddress : client.primary_address,
          co_owner: newCoowner != "" ? newCoowner : client.co_owner,
          co_owner_phone_number:
            newCoPhone != "" ? newCoPhone : client.co_owner_phone_number,
        });
      }
      await deleteChanges(false);

      // Everything updated fine
      await updateDoc(appointment.appointment_ref, {
        status: Status.AwaitingPickup,
      });
      showNotification("success", "Accepted Changes");

      console.log("How many times do I send the client a message?");
      sendClientMessage(
        `We've received your form, we'll be out to pickup ${
          pet?.name ?? "your pet"
        } shortly!`
      );
    } catch (error) {
      console.log("Cannot update doc", error);
    }
  }

  //Simple time format string
  function currentTimeToString() {
    const now = new Date();
    const dateString = now.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      hourCycle: "h12",
    });
    return dateString;
  }

  //Adds message to database
  async function addMessageToDatabase(data: ChatInfo) {
    if (!addMessagesToDB) return;
    const messageCollection = collection(firestore, "messages");
    const mesCollectConv = collection(firestore, "messages").withConverter(
      messageConverter
    );
    const messageQuery = query(
      mesCollectConv,
      where("appointment_id", "==", appointment.appointment_id)
    );
    const messageSnapshot = await getDocs(messageQuery);
    const loadedMessages: MessageType[] = messageSnapshot.docs.map((doc) => {
      return doc.data();
    });

    await addDoc(messageCollection, {
      appointment_id: appointment.appointment_id,
      content: data.message,
      message_id: loadedMessages.length,
      name: data.username,
      timestamp: Timestamp.fromDate(new Date()),
      uid: data.uid,
      shouldNotify: data.shouldNotify,
    });
  }

  function sendClientMessage(content: string) {
    const data: ChatInfo = {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      username: `Admin: ${admin?.first_name} `,
      message: content,
      time_sent: currentTimeToString(),
      uid: admin?.uid,
      shouldNotify: true,
    };

    channel?.trigger("client-handled-message", data);
    void addMessageToDatabase(data);
    notificationChannel?.trigger(
      "client-create-message-notification",
      appointment.appointment_id
    );
    const textMessage = {
      apptID: appointment.appointment_id,
      message: data.message,
      senderName: data.username,
    };
    notificationChannel?.trigger(
      "client-text-message-notification-" + appointment.client_id,
      textMessage
    );
  }

  async function deleteChanges(showToast: boolean) {
    if (appointmentChangeRef) {
      await deleteDoc(appointmentChangeRef.ref);
    }
    await setStatus(Status.AwaitingPickup);
    if (showToast) {
      showNotification("warning", "Denied Changes");
      sendClientMessage(
        `We've received your form, we'll be out to pickup ${
          pet?.name ?? "your pet"
        } shortly!`
      );
    }
  }

  async function setStatus(newStatus: string) {
    updatePage(!change);
    if (newStatus == Status.CheckedIn)
      showNotification("success", "Pet has been picked up");
    if (newStatus == Status.CheckedOut)
      showNotification("success", "Now checking out client");
    if (newStatus == Status.Closed)
      showNotification("success", "Appointment complete!");
    await setDoc(
      appointment.appointment_ref,
      { status: newStatus },
      { merge: true }
    );
  }

  function renderButton(status: string) {
    switch (status) {
      case Status.Waiting:
        return (
          <button
            className="btn-primary btn"
            onClick={async () => {await setStatus(Status.Reviewing) }}
          >
            Review Checkin Form
          </button>
        );
      case Status.AwaitingPickup:
        return (
          <button
            className="btn-primary btn"
            onClick={() => setStatus(Status.CheckedIn)}
          >
            Picked Up Pet?
          </button>
        );
      case Status.CheckedIn:
        return (
          <button
            className="btn-primary btn"
            onClick={() => setStatus(Status.CheckingOut)}
          >
            Check Out
          </button>
        );
      case Status.CheckedOut:
        return (
          <button
            className="btn-primary btn"
            onClick={() => setStatus(Status.Closed)}
          >
            Returned Pet?
          </button>
        );
      default:
        return <p></p>;
    }
  }

  function getStatusNumber(status: string) {
    switch (status) {
      case Status.Upcoming:
        return -1;
      case Status.NotCheckedIn:
        return 0;
      case Status.Waiting:
        return 1;
      case Status.Reviewing:
        return 2;
      case Status.AwaitingPickup:
        return 3;
      case Status.CheckedIn:
        return 4;
      case Status.CheckingOut:
        return 5;
      case Status.InvoiceSent:
        return 6;
      case Status.CheckedOut:
        return 7;
      case Status.Closed:
        return 8;
      default:
        return -100;
    }
  }

  function checkProgress(status: string, step: string): string {
    return getStatusNumber(status) >= getStatusNumber(step)
      ? "step px-2 step-primary"
      : "step px-2";
  }

  async function handleCopyClick(textToCopy: string) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      showNotification("success", `Copied to clipboard`);
      console.log(`Copied "${textToCopy}" to the clipboard`);
    } catch (err) {
      console.error(`Failed to copy text`);
      showNotification("error", "Error copying to clipboard");
    }
  }

  function sendInvoiceMessage() {
    sendClientMessage(
      `We've completed ${
        pet?.name ?? "your pet"
      }'s appointment! Waiting for invoice fulfillment.`
    );
  }

  type copyProps = {
    textToCopy: string;
  };

  function CopyPaste(props: copyProps) {
    return (
      <button
        className="btn-primary btn h-full rounded-l-none rounded-tr-none border-neutral-600 bg-neutral-700 hover:scale-[1.0]"
        onClick={async () => {
          await handleCopyClick(props.textToCopy);
        }}
      >
        <i className="fa fa-copy"></i>
      </button>
    );
  }

  function addBorderForString(a: string, b: string) {
    return a === b ? "flex h-full flex-row" : "flex h-full border-warning border-[3px] rounded-br-xl flex-row";
  }

  function addBorderForNumber(a: number, b: number) {
    return a === b ? "flex h-full flex-row" : "flex h-full border-warning border-[3px] rounded-br-xl flex-row";
  }

  function addToolTipForString(a: string, b: string) {
    return a === b ? "mb-2 w-full" : "tooltip tooltip-primary mb-2 w-full";
  }

  function addToolTipForNumber(a: number, b: number) {
    return a === b ? "mb-2 w-full" : "tooltip tooltip-primary mb-2 w-full";
  }

  function hasChanges(): boolean {
    if (`${appointment.spot_number}` !== `${newSpot}`) return true;
    if (appointment.notes !== newNotes) return true;
    if (client) {
      if (`${client.first_name} ${client.last_name}` !== newName) return true;
      if (client.phone_number !== newPhone) return true;
      if (client.primary_address !== newAddress) return true;
      if (client.secondary_address !== new2Address) return true;
      if (client.employer !== newEmployer) return true;
      if (client.email !== newEmail) return true;
      if (client.co_owner !== newCoowner) return true;
      if (client.co_owner_phone_number !== newCoPhone) return true;
    }
    return false;
  }

  return (
    <div className="pb-3">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      ></link>
      {(appointment?.appointment_id != null && (
        <div key={appointment.appointment_id}>
          {/* App Info */}
          <div className="px-6">
            <div className="grid grid-cols-2">
              <div className="flex flex-col">
                {/* Top vertical space */}
                <div className="flex-grow"></div>
                <h1 className="mt-3 text-2xl">
                  <b>
                    {appointment.reason}{" "}
                    {appointment.spot_number > 0
                      ? `- Spot #${appointment.spot_number}`
                      : ""}
                  </b>
                </h1>
              </div>
            </div>

            <hr></hr>
            <p className="text-md pb-3">{appointment.date.toLocaleString()}</p>

            {/* Progress Meter */}
            <ul className="steps mb-2 w-full rounded-md border border-gray-800 bg-neutral py-3 shadow-md">
              <li className={checkProgress(appointment.status, "waiting")}>
                Checked-In
              </li>
              <li
                className={checkProgress(appointment.status, "awaiting_pickup")}
              >
                Form Reviewed
              </li>
              <li className={checkProgress(appointment.status, "checked_in")}>
                Pet Picked Up
              </li>
              <li className={checkProgress(appointment.status, "invoice_sent")}>
                Invoice Sent
              </li>
              <li className={checkProgress(appointment.status, "checked_out")}>
                Paid
              </li>
              <li className={checkProgress(appointment.status, "closed")}>
                Pet Returned
              </li>
              <li className={checkProgress(appointment.status, "closed")}>
                Done
              </li>
            </ul>

            <div className="flex flex-row gap-2">
              {/* Actions n Info */}
              <div className="flex w-2/3 flex-col">
                {/* Profile info (client & pet) */}
                <div className="mb-2 rounded-md bg-neutral p-3">
                  <div className="flex flex-row gap-6">
                    {/* Client info */}
                    <div>
                      {client ? (
                        <div className="flex flex-row gap-3">
                          {/* Profile picture */}
                          <div className="flex flex-col">
                            {!client_image_loading &&
                            !client_image_error &&
                            client_image_url ? (
                              <Avatar image={client_image_url} />
                            ) : (
                              <Avatar image={"/images/profile_icon.png"} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-lg">
                              <b>
                                {client.first_name} {client.last_name}
                              </b>
                            </p>
                            <p className="text-sm">
                              {formatPhoneNumber(client.phone_number)}
                            </p>
                            <p className="text-sm">{client.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p>Client not found</p>
                      )}
                    </div>
                    {/* Pet List */}
                    <div>
                      {pet ? (
                        <div className="flex flex-row gap-3">
                          {/* Pet picture */}
                          <div className="flex flex-col">
                            {!image_loading && !image_error && image_url ? (
                              <Avatar image={image_url} />
                            ) : (
                              <Avatar image={"/images/paw_icon.png"} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-lg">
                              <b>{pet.name}</b>
                            </p>
                            <p className="text-sm">
                              {pet.species}: {pet.breed}
                            </p>
                            <p className="text-sm">
                              {pet.DOB.toLocaleDateString()}{" "}
                              {`(${
                                new Date().getFullYear() - pet.DOB.getFullYear()
                              } years old)`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p>Pet not found</p>
                      )}
                    </div>
                  </div>
                  <hr className="my-2"></hr>
                  <div className="flex flex-col w-full">
                    {appointment.admin_notes && appointment.admin_notes !== "" ? (
                      <p>
                        <b>Admin Notes: </b>
                        {appointment.admin_notes}
                      </p>
                    ) : (
                      <p>
                        <b>No Admin Notes</b>
                      </p>
                    )}
                    {appointment.notes && appointment.notes !== "" ? (
                        <p>
                          <b>Client Notes: </b>
                          {appointment.notes}
                        </p>
                      ) : (
                        <p>
                          <b>No Client Notes</b>
                        </p>
                      )}
                  </div>
                </div>

                {/* FORM REVIEW */}
                {appointment.status === Status.Reviewing &&
                  appointmentChange && (
                    <div className="mb-2 rounded-md border border-gray-800 bg-neutral p-3">
                      <h1 className="text-center text-xl">
                        <b>Form Review</b>
                      </h1>
                      <p className="w-full mb-1 text-center text-warning">(Yellow border signifies a change)</p>
                      <hr></hr>
                      {client_error && (
                        <strong>Error: {JSON.stringify(client_error)}</strong>
                      )}
                      {client_loading && (
                        <progress className="progress progress-primary w-full"></progress>
                      )}
                      {client && (
                        <>
                          <div className="mt-2 flex flex-row gap-3">
                            {/* Left side */}
                            <div className="flex w-full flex-col">
                              {/* Spot # */}
                              <div
                                className={addToolTipForNumber(appointment.spot_number, +newSpot)}
                                data-tip={`Was: ${
                                  `${appointment.spot_number}` ?? "Blank"
                                }`}
                              >
                                <div className={addBorderForNumber(appointment.spot_number, +newSpot)}>
                                  <div className="w-full">
                                    <label className="input-group input-group-vertical">
                                      <span>
                                        <b>Spot #</b>
                                      </span>
                                    </label>
                                    <div className="flex flex-row">
                                      <input
                                        type="text"
                                        className="text-area input-bordered input w-full"
                                        placeholder="Spot"
                                        defaultValue={appointmentChange?.spot}
                                        onChange={(e) =>
                                          setNewSpot(e.target.value)
                                        }
                                      ></input>
                                      <CopyPaste
                                        textToCopy={
                                          newSpot === "" || newSpot == undefined
                                            ? `${appointmentChange.spot}`
                                            : `${newSpot}`
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Notes */}
                              <div
                                className={addToolTipForString(appointment.notes, newNotes)}
                                data-tip={`Was: ${
                                  appointment.notes ?? "Blank"
                                }`}
                              >
                                <div className={addBorderForString(appointment.notes, newNotes)}>
                                  <div className="w-full">
                                    <label className="input-group input-group-vertical">
                                      <span>
                                        <b>Notes</b>
                                      </span>
                                    </label>
                                    <div className="flex flex-row">
                                      <textarea
                                        className="text-area input-bordered input w-full"
                                        placeholder="Notes"
                                        defaultValue={appointmentChange.notes}
                                        onChange={(e) =>
                                          setNewNotes(e.target.value)
                                        }
                                      ></textarea>
                                      <CopyPaste
                                        textToCopy={
                                          newNotes === "" ||
                                          newNotes == undefined
                                            ? appointmentChange.notes
                                            : newNotes
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Right side */}
                            <div className="flex w-full flex-col">
                              {client_error && (
                                <strong>
                                  Error: {JSON.stringify(client_error)}
                                </strong>
                              )}
                              {client && (
                                <>
                                  {/* Name */}
                                  <div
                                    className={addToolTipForString(`${client.first_name} ${client.last_name}`, newName)}
                                    data-tip={`Was: ${
                                      `${client.first_name} ${client.last_name}` ??
                                      "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(`${client.first_name} ${client.last_name}`, newName)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>Name</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Name"
                                            defaultValue={
                                              appointmentChange.name
                                            }
                                            onChange={(e) =>
                                              setNewName(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              newName === "" ||
                                              newName == undefined
                                                ? appointmentChange.name
                                                : newName
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Prime Phone # */}
                                  <div
                                    className={addToolTipForString(client.phone_number, newPhone)}
                                    data-tip={`Was: ${
                                      `${client.phone_number}` ?? "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(client.phone_number, newPhone)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>Phone #</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Phone"
                                            defaultValue={
                                              appointmentChange.primary_phone
                                            }
                                            onChange={(e) =>
                                              setNewPhone(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              newPhone === "" ||
                                              newPhone == undefined
                                                ? appointmentChange.primary_phone
                                                : newPhone
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Email */}
                                  <div
                                    className={addToolTipForString(client.email, newEmail)}
                                    data-tip={`Was: ${
                                      `${client.email}` ?? "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(client.email, newEmail)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>Email</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Email"
                                            defaultValue={
                                              appointmentChange.email
                                            }
                                            onChange={(e) =>
                                              setNewEmail(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              newEmail === "" ||
                                              newEmail == undefined
                                                ? appointmentChange.email
                                                : newEmail
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Address */}
                                  <div
                                    className={addToolTipForString(client.primary_address, newAddress)}
                                    data-tip={`Was: ${
                                      `${client.primary_address}` ?? "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(client.primary_address, newAddress)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>Address</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Address"
                                            defaultValue={
                                              appointmentChange.primary_address
                                            }
                                            onChange={(e) =>
                                              setNewAddress(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              newAddress === "" ||
                                              newAddress == undefined
                                                ? appointmentChange.primary_address
                                                : newAddress
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* 2nd Address */}
                                  <div
                                    className={addToolTipForString(client.secondary_address, new2Address)}
                                    data-tip={`Was: ${
                                      `${client.secondary_address}` ?? "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(client.secondary_address, new2Address)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>2nd Address</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Secondary Address"
                                            defaultValue={
                                              appointmentChange.secondary_address
                                            }
                                            onChange={(e) =>
                                              setNew2Address(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              new2Address === "" ||
                                              new2Address == undefined
                                                ? appointmentChange.secondary_address
                                                : new2Address
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Co Owner # */}
                                  <div
                                    className={addToolTipForString(client.co_owner, newCoowner)}
                                    data-tip={`Was: ${
                                      `${client.co_owner}` ?? "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(client.co_owner, newCoowner)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>Co-owner</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Co-owner"
                                            defaultValue={
                                              appointmentChange.coowner
                                            }
                                            onChange={(e) =>
                                              setNewCoowner(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              newCoowner === "" ||
                                              newCoowner == undefined
                                                ? appointmentChange.coowner
                                                : newCoowner
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Coowner Phone # */}
                                  <div
                                    className={addToolTipForString(client.co_owner_phone_number, newCoPhone)}
                                    data-tip={`Was: ${
                                      `${client.co_owner_phone_number}` ??
                                      "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(client.co_owner_phone_number, newCoPhone)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>Co-owner Phone #</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Co-owner's Phone"
                                            defaultValue={
                                              appointmentChange.coowner_phone
                                            }
                                            onChange={(e) =>
                                              setNewCoPhone(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              newCoPhone === "" ||
                                              newCoPhone == undefined
                                                ? appointmentChange.coowner_phone
                                                : newCoPhone
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Employer */}
                                  <div
                                    className={addToolTipForString(client.employer, newEmployer)}
                                    data-tip={`Was: ${
                                      `${client.employer}` ?? "Blank"
                                    }`}
                                  >
                                    <div className={addBorderForString(client.employer, newEmployer)}>
                                      <div className="w-full">
                                        <label className="input-group input-group-vertical">
                                          <span>
                                            <b>Employer</b>
                                          </span>
                                        </label>
                                        <div className="flex flex-row">
                                          <input
                                            type="text"
                                            className="text-area input-bordered input w-full"
                                            placeholder="Employer"
                                            defaultValue={
                                              appointmentChange.employer
                                            }
                                            onChange={(e) =>
                                              setNewEmployer(e.target.value)
                                            }
                                          ></input>
                                          <CopyPaste
                                            textToCopy={
                                              newEmployer === "" ||
                                              newEmployer == undefined
                                                ? appointmentChange.employer
                                                : newEmployer
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className={`mt-3 grid grid-cols-3 gap-4`}>
                            <button
                              className="btn-error btn-outline rounded-md hover:scale-[0.98] btn"
                              onClick={() => deleteChanges(true)}
                              >
                              DENY CHANGES
                            </button>
                            <button
                              className={`btn-primary ${!hasChanges() ? 'btn-disabled' : ""} btn`}
                              onClick={() => AcceptChanges()}
                              >
                              ACCEPT CHANGES
                            </button>
                            {hasChanges() && <div></div>}
                            {!hasChanges() &&
                              <button
                              className="btn-primary btn"
                              onClick={() => deleteChanges(false)}
                              >
                              CONTINUE
                              </button>
                            }
                          </div>
                        </>
                      )}
                    </div>
                  )}

                {/* INVOICE */}
                <div>
                  {appointment.status === Status.CheckingOut &&
                  client &&
                  appointment ? (
                    <div className="mb-2 rounded-md border border-gray-800 bg-neutral p-3 shadow-lg">
                      <InvoiceInfo
                        appointment={appointment}
                        client={client}
                        sendMessage={sendInvoiceMessage}
                      />
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>

                <ul className="menu">
                  {/* Next step Button */}
                  {renderButton(appointment.status)}
                </ul>
              </div>
              {/* Messaging */}
              <div className="flex w-1/3 flex-col">
                <ChatBox {...appointment} />
              </div>
            </div>
          </div>
        </div>
      )) || <p>Select an appointment</p>}
    </div>
  );
}
