import type { DocumentReference, DocumentData } from "firebase/firestore"

export type AppointmentType = {
    client_id: string,
    intravet_client_id: string,
    status: string,
    notes: string,
    admin_notes: string,
    reason: string,
    appointment_id: string,
    visit_id: string,
    spot_number: number,
    messages: DocumentReference<DocumentData>,
    client: DocumentReference<DocumentData>,
    pet: DocumentReference<DocumentData>,
    date: Date
    appointment_ref: DocumentReference<DocumentData>;
    cost: number;
}

export type AppointmentDataType = {
    notes: string,
    spot: number,
    appointment_ref: DocumentReference<DocumentData>;
    name: string;
    email: string;
    primary_phone: string;
    coowner_phone: string;
    employer: string;
    work_phone: string;
    uid: string;
    primary_address: string;
    secondary_address: string;
    coowner: string;
    parked_somewhere_else: string;
}


export type ClientType = {
    uid: string;
    intravet_id: string;
    account_no: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    DOB: Date;
    primary_address: string;
    secondary_address: string;
    refferal: string;
    co_owner: string;
    co_owner_phone_number: string;
    employer: string;
    trusted_persons: string;
    client_ref: DocumentReference<DocumentData>;
}

export type PetType = {
    pet_id: string;
    name: string;
    DOB: Date;
    breed: string;
    appearance: string;
    color: string;
    sex: string;
    microchipped: boolean;
    species: string;
    tattooed: boolean;
    client_id: string;
    intravet_client_id: string;
    pet_ref: DocumentReference<DocumentData>;
}

export type AdminType = {
    admin_id: string;
    doc_id: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    uid: string;
}

export type MessageType = {
    appointment_id: string;
    content: string;
    message_id: number;
    name: string;
    timestamp: Date;
    uid: string;
    shouldNotify: boolean;
}

export enum Status {
  Upcoming = "upcoming",
  NotCheckedIn = "not_checked_in",
  Waiting = "waiting",
  Reviewing = "reviewing",
  AwaitingPickup = "awaiting_pickup",
  CheckedIn = "checked_in",
  CheckingOut = "checking_out",
  InvoiceSent = "invoice_sent",
  CheckedOut = "checked_out",
  Closed = "closed"
}

export type PusherDetails = {
    appId: string,
    key: string,
    secret: string,
    cluster: string
  }

export type ChatInfo = {
    username: string | null | undefined;
    message: string;
    time_sent: string;
    uid: string | undefined;
    shouldNotify: boolean;
}

export type NotificationInfo = {
    apptID: string;
    appointmentNotifications: number;
    messageNotifications: number;
    hasCompletedProcessStep: boolean;
}

export type TextMessageInfo = {
    apptID: string;
    message: string;
    senderName: string;
  }