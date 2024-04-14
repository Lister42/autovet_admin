import React, { useEffect, useState } from "react";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { Status, type AppointmentType } from "@/utils/types";
import { formatPhoneNumber, formatTime } from "@/utils/format";
import { clientConverter } from "@/utils/firebase";
import { appointmentNotificationList, notificationChannelInstance, observedAppointmentChannels, processNotification } from "@/utils/pusherUtil";
import { setDoc } from "firebase/firestore";

interface Props {
  appointment: AppointmentType;
}

export default function Appointment({appointment}: Props) {
  // useDocumentDataOnce is a hook that fetches a document once and returns the data
  //TODO: We should probably cache this stuff because it is fetching from the database everytime the react component updates
  const [client, client_loading, client_error] = useDocumentData(
    appointment.client.withConverter(clientConverter)
  );

  const [curApptID, setCurApptID] = useState<string>();
  //Date.now() is used to generate a consistent unique number on every run so they always update
  const [notifUpdater, updateNotifUpdater] = useState(Date.now());
  const [addNotification, setAddNotification] = useState(Date.now());
  const [change, updatePage] = useState(false);

  //Weird hacked ChatGPT plug that makes a piece of code only run once regardless of how many times a React functional component re-renders.... Just believe me.
  useEffect(() => {
    //If user hasn't even viewed the appointment
    if (curApptID) {
      if (!(curApptID in observedAppointmentChannels)) {
        
        //So appointment notifications and message notifications should only be updated
        appointmentNotificationList[curApptID] = {
          apptID: curApptID,
          appointmentNotifications: (appointmentNotificationList[curApptID]?.appointmentNotifications ?? 0) + 1,
          messageNotifications: (appointmentNotificationList[curApptID]?.messageNotifications ?? 0) + 1,
          hasCompletedProcessStep: false
        }
        updateNotifUpdater(Date.now())
        //do stuff to make sure the new messages have red icons beside them

      } //If user has viewed appointment at some point but left
        else if (((curApptID in observedAppointmentChannels) && !observedAppointmentChannels[curApptID])) {
          appointmentNotificationList[curApptID] = {
            apptID: curApptID,
            appointmentNotifications: (appointmentNotificationList[curApptID]?.appointmentNotifications ?? 0) + 1,
            messageNotifications: (appointmentNotificationList[curApptID]?.messageNotifications ?? 0) + 1,
            hasCompletedProcessStep: false
          }
          updateNotifUpdater(Date.now())
        //do stuff to make sure the new messages have red icons beside them
      }
      //Then user is currently viewing the appointment that received the notification
      else if (observedAppointmentChannels[curApptID]) {
        appointmentNotificationList[curApptID] = {
          apptID: curApptID,
          appointmentNotifications: (appointmentNotificationList[curApptID]?.appointmentNotifications ?? 0),
          messageNotifications: (appointmentNotificationList[curApptID]?.messageNotifications ?? 0),
          hasCompletedProcessStep: false
        }
        updateNotifUpdater(Date.now())
        console.log("should still update right?");
        //If we want then, this logic allows us to do special effects on messages as they appear. Might need to do some fancy work tho to talk with chatBox.
      }
    } else {
      console.log("Appointment ID was undefined", curApptID);
    }
  }, [addNotification])

  useEffect(() => {
    async function handleNotification() {
      const nChannel = await notificationChannelInstance;
      nChannel.bind("client-create-message-notification", (apptID: string) => {
        //Only send a notification if you are the associated appointment (since it will call on all the listed appointments)
        if (apptID == appointment.appointment_id) {
          const randomAddTrigger = Date.now();
          //Will always increment so it will always update
          setAddNotification(randomAddTrigger);
          setCurApptID(apptID);
        }
      })
      nChannel.bind('client-create-process-notification', (apptID: string) => {
        if (apptID == appointment.appointment_id) {
          //Will show toast when loading appointment details
          const randomAddTrigger = Date.now();
          processNotification[apptID] = true;
          setAddNotification(randomAddTrigger);
          setCurApptID(apptID);
        }
      })
      }
    void handleNotification();

    if (isCloseEnoughInTimeToCheckIn(appointment.date) && (appointment.status == "upcoming")) {
      updateFromUpcomingToNotCheckedIn();
    }
  }, [])

  const isCloseEnoughInTimeToCheckIn = (date: Date): boolean => {
    const now = new Date();
    //less than 5 minutes away or past the current time
    return (Date.now() - date.getTime() <= 5*60*1000) || (date.getTime() < now.getTime());
  }

  function updateFromUpcomingToNotCheckedIn() {
    void setStatus(Status.NotCheckedIn);
  }

  async function setStatus(newStatus: string) {
    updatePage(!change);
    await setDoc(
      appointment.appointment_ref,
      {status: newStatus},
      {merge: true}
    )
  }
  return (
    <button className="btn-primary btn-block mb-1 text-sm">
      <div className="grid grid-cols-10 border border-gray-800 rounded-lg">
      {/* Time */}
      <div className="bg-green-800 rounded-s-lg col-span-3 text-center p-3">
        {/* Indicator would go here */}
        {/* <b>
          O
        </b> */}
        <b>
          {formatTime(appointment.date)}
        </b>
      </div>
      {/* Spot Number */}
      <div className={appointment.spot_number > 0 ? "bg-neutral col-span-1 text-center p-3" : "bg-primary col-span-1 text-center p-3"}>
        {appointment.spot_number > 0 ? 
            <b>{appointment.spot_number}</b>
            :
            ""
          }
      </div>
      {/* Appointment Peek */}
      <div key={appointment.appointment_id} className="indicator rounded-e-lg bg-primary col-span-6 p-3 btn-block">
      {client ? (
        <div className="">

          {/* Badge indicator for stage */}
          <>
          {appointment.status === Status.Upcoming ? (
            <span className="badge indicator-center indicator-item">Upcoming</span>
          ) : appointment.status === Status.Waiting ? (
            <span className="badge-warning indicator-center badge indicator-item">Waiting</span>
          ) : appointment.status === Status.CheckedIn ? (
            <span className="badge-success indicator-center badge indicator-item">
              Checked In
            </span>
          ) : appointment.status === Status.AwaitingPickup ? (
            <span className="badge-warning indicator-center badge indicator-item">
              Awaiting Pickup
            </span>
          ) : appointment.status === Status.CheckingOut ? (
            <span className="badge-warning indicator-center badge indicator-item">
              Checking Out
            </span>
          ) : appointment.status === Status.InvoiceSent ? (
            <span className="badge-accent indicator-center badge indicator-item">
              Invoice Sent
            </span>
          ) : (
            <></>
          )}
          </>
          {/*Make sure to only display notifications if there are currently more than 0*/}
          {((appointmentNotificationList[appointment.appointment_id]?.appointmentNotifications ?? 0)) > 0 ? (
            <div className="indicator-end indicator-item">
              <div className="relative inline-flex rounded-full h-5 w-5 bg-red-600 justify-center pt-0.5">{(appointmentNotificationList[appointment.appointment_id]?.appointmentNotifications ?? 0)}</div>
            </div>
          ) : (<></>)}

          <b>
            {client.first_name} <span className="inline-grid">{formatPhoneNumber(client.phone_number)}</span>
          </b>
        </div>

      ) : client_loading ? (
        <></>
      ) : client_error ? (
        <span>Error: {JSON.stringify(client_error.message)}</span>
      ) : (
        <span>Client Not Found</span>
      )}
    </div>
    </div>
    </button>
    
  );
}
