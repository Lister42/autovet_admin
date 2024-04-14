import { collection, orderBy, query, where } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { appointmentConverter, firestore } from "@/utils/firebase";
import { type AppointmentType, Status } from "@/utils/types";
import Appointment from "@/components/appointment";
import AppointmentDetails from "@/components/appointmentDetails";
import React, { useState } from "react";
import {
  appointmentNotificationList,
  observedAppointmentChannels,
} from "@/utils/pusherUtil";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function Appointments() {
  // useCollectionData is a hook that continiously listens to a collection and returns the data

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(
    new Date(2023, 3, 20, 0, 0, 0, 0)
  ); //new Date(2023, 1, 17, 0, 0, 0, 0));//new Date(2019, 9, 10, 0, 0, 0, 0));//new Date(2023, 1, 17, 0, 0, 0, 0)); // TODO: change to new Date()

  function addDay(amount: number) {
    setSelectedDay(
      new Date(
        selectedDay ? selectedDay.getFullYear() : 0,
        selectedDay ? selectedDay.getMonth() : 0,
        selectedDay ? selectedDay.getDate() + amount : 0 + amount,
        0,
        0,
        0,
        0
      )
    );
  }

  const [appointments, loading_appointments] = useCollectionData(
    query(
      collection(firestore, "appointment").withConverter(appointmentConverter),
      where(
        "date",
        ">=",
        new Date(
          selectedDay ? selectedDay.getFullYear() : 0,
          selectedDay ? selectedDay.getMonth() : 0,
          selectedDay ? selectedDay.getDate() : 0,
          0,
          0,
          0,
          0
        )
      ),
      where(
        "date",
        "<=",
        new Date(
          selectedDay ? selectedDay.getFullYear() : 0,
          selectedDay ? selectedDay.getMonth() : 0,
          selectedDay ? selectedDay.getDate() : 0,
          23,
          59,
          59,
          999
        )
      ),
      orderBy("date", "asc") // sort by descending date
      //orderBy("status"), // sort by status
    ),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentType>();

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>();

  function resetSelectedAppointment() {
    console.log("Reseting selected appointment");
    setSelectedAppointment(undefined);
    if (selectedAppointmentId)
      observedAppointmentChannels[selectedAppointmentId] = false;
    setSelectedAppointmentId(undefined);
  }

  function resetNotifications(apptID: string) {
    console.log("Resetting notifications");
    //if apptID is not in the appointmentNotificationList
    if (!(apptID in appointmentNotificationList)) {
      console.log("This should never happen");
    } else {
      appointmentNotificationList[apptID] = {
        apptID: apptID,
        appointmentNotifications: 0,
        messageNotifications:
          (appointmentNotificationList[apptID]?.messageNotifications ?? 0) + 1,
        hasCompletedProcessStep: false,
      };
    }
  }

  return (
    <div>
      <div className="flex h-full flex-row">
        {/* Appointment Selection/List */}
        <div className="h-screen w-1/4 flex-none flex-col border-r border-gray-800 px-3 pt-3 shadow-xl">
          {/* Date Selector */}
          <div className="mb-2 grid grid-cols-6">
            <button
              onClick={() => {
                addDay(-1);
                {
                  resetSelectedAppointment();
                }
              }}
              className="btn-secondary col-span-1 rounded-s-md"
            >
              <b>{`<`}</b>
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="btn col-span-4 text-inherit">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDay ? (
                    format(selectedDay, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  initialFocus
                  className="bg-neutral"
                />
              </PopoverContent>
            </Popover>
            <button
              onClick={() => {
                addDay(1);
                {
                  resetSelectedAppointment();
                }
              }}
              className="btn-secondary col-span-1 rounded-e-md"
            >
              <b>{`>`}</b>
            </button>
          </div>

          <ul className="">
            {/* List Appointments */}
            {appointments && appointments.length !== 0 ? (
              appointments // Filter by day
                .filter((app) => app.status !== Status.Closed)
                .map((appointment) => (
                  <li
                    className=""
                    key={appointment.appointment_id}
                    onClick={() => {
                      setSelectedAppointmentId(appointment.appointment_id);
                      setSelectedAppointment(appointment);
                      resetNotifications(appointment.appointment_id);
                    }}
                  >
                    <div className={appointment.appointment_id === selectedAppointmentId ? "scale-[0.97] brightness-75" : ""}>
                      <Appointment appointment={appointment} />
                    </div>
                  </li>
                ))
            ) : loading_appointments ? (
              <progress className="progress progress-primary w-full"></progress>
            ) : (
              <span className="pt-1 text-center">No Appointments</span>
            )}
          </ul>
        </div>

        {/* Appointment Details/Content */}
        <div className="flex flex-grow flex-col">
          {selectedAppointmentId &&
          appointments &&
          selectedAppointment &&
          selectedDay &&
          selectedAppointment.date.getDay() == selectedDay.getDay() ? (
            <AppointmentDetails
              {...(appointments.find(
                (x) => x.appointment_id == selectedAppointmentId
              ) || selectedAppointment)}
            />
          ) : (
            <div className="px-6 pt-3">
              <h1 className="pb-1 text-2xl">
                <b>Appointment Details</b>
              </h1>
              <hr></hr>

              <p>Select an appointment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
