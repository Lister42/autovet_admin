import { initializeApp } from "firebase/app";
import type {
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  WithFieldValue,
  Timestamp} from "firebase/firestore";
import {
  collection,
  getDocs
} from "firebase/firestore";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { AppointmentType, AppointmentDataType, ClientType, PetType, AdminType, MessageType } from "./types";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVbNwodzMRNP-MFTCDOjQ62gX1xvF10KE",

  authDomain: "autovet-db.firebaseapp.com",

  projectId: "autovet-db",

  storageBucket: "autovet-db.appspot.com",

  messagingSenderId: "509888252098",

  appId: "1:509888252098:web:1cd34fb3d2468f3570935b",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

export const firestore = getFirestore(firebaseApp);

// Initialize Firebase Auth and export it to be used in other files
export const auth = getAuth(firebaseApp);

export const storage = getStorage(firebaseApp);

export const appointmentConverter: FirestoreDataConverter<AppointmentType> = {
  toFirestore: (appointment: WithFieldValue<AppointmentType>): DocumentData =>
    appointment,
  fromFirestore: (snapshot, options): AppointmentType => {
    const data = snapshot.data(options);
    return {
      client_id: data.client_id as string,
      intravet_client_id: data.intravet_client_id as string,
      status: data.status as string,
      notes: data.notes as string,
      admin_notes: data.admin_notes as string,
      reason: data.reason as string,
      appointment_id: data.appointment_id as string,
      visit_id: data.visit_id as string,
      spot_number: data.spot_number as number,
      messages: data.messages as DocumentReference<DocumentData>,
      client: data.client as DocumentReference<DocumentData>,
      date: (data.date as Timestamp).toDate(),
      pet: data.pet as DocumentReference<DocumentData>,
      appointment_ref: snapshot.ref,
      cost: data.cost as number
    };
  },
};

export const appointmentDataConverter: FirestoreDataConverter<AppointmentDataType> = {
  toFirestore: (client: WithFieldValue<AppointmentDataType>): DocumentData => client,
  fromFirestore: (snapshot, options): AppointmentDataType => {
    const data = snapshot.data(options);
    return {
      uid: data.uid as string,
      name: data.name as string,
      email: data.email as string,
      primary_phone: data.primary_phone as string,
      primary_address: data.primary_address as string,
      secondary_address: data.secondary_address as string,
      coowner: data.coowner as string,
      coowner_phone: data.coowner_phone as string,
      employer: data.employer as string,
      work_phone: data.work_phone as string,
      notes: data.notes as string,
      spot: data.spot as number,
      appointment_ref: data.apppointment_ref as DocumentReference<DocumentData>,
      parked_somewhere_else: data.parked_somewhere_else as string,
    };
  },
};

export const clientConverter: FirestoreDataConverter<ClientType> = {
  toFirestore: (client: WithFieldValue<ClientType>): DocumentData => client,
  fromFirestore: (snapshot, options): ClientType => {
    const data = snapshot.data(options);
    return {
      uid: data.uid as string,
      intravet_id: data.intravet_id as string,
      account_no: data.account_no as number,
      first_name: data.first_name as string,
      last_name: data.last_name as string,
      email: data.email as string,
      phone_number: data.phone_number as string,
      DOB: (data.DOB as Timestamp).toDate() || undefined,
      primary_address: data.primary_address as string,
      secondary_address: data.secondary_address as string,
      refferal: data.refferal as string,
      co_owner: data.co_owner as string,
      co_owner_phone_number: data.co_owner_phone_number as string,
      employer: data.employer as string,
      trusted_persons: data.trusted_persons as string,
      client_ref: snapshot.ref
    };
  },
};

export const petConverter: FirestoreDataConverter<PetType> = {
  toFirestore: (pet: WithFieldValue<PetType>): DocumentData => pet,
  fromFirestore: (snapshot, options): PetType => {
    const data = snapshot.data(options);
    return {
      pet_id: data.pet_id as string,
      name: data.name as string,
      DOB: (data.DOB as Timestamp).toDate(),
      breed: data.breed as string,
      appearance: data.appearance as string,
      color: data.color as string,
      sex: data.sex as string,
      microchipped: data.microchipped as boolean,
      species: data.species as string,
      tattooed: data.tattooed as boolean,
      client_id: data.client_id as string,
      intravet_client_id: data.intravet_client_id as string,
      pet_ref: snapshot.ref,
    };
  },
};

export const adminConverter: FirestoreDataConverter<AdminType> = {
  toFirestore: (admin: WithFieldValue<AdminType>): DocumentData => admin,
  fromFirestore: (snapshot, options): AdminType => {
    const data = snapshot.data(options);
    return {
      admin_id: data.admin_id as string,
      doc_id: data.doc_id as string,
      email: data.email as string,
      first_name: data.first_name as string,
      last_name: data.last_name as string,
      password: data.password as string,
      uid: data.uid as string
    };
  }
}

export const messageConverter: FirestoreDataConverter<MessageType> = {
  toFirestore: (message: WithFieldValue<MessageType>): DocumentData => message,
  fromFirestore: (snapshot, options): MessageType => {
    const data = snapshot.data(options);
    return {
      appointment_id: data.appointment_id as string,
      content: data.content as string,
      message_id: data.message_id as number,
      name: data.name as string,
      timestamp: (data.timestamp as Timestamp).toDate(),
      uid: data.uid as string,
      shouldNotify: data.shouldNotify as boolean
    };
  }
}

export async function getUserIds(): Promise<string[]> {
  const clients = collection(firestore, "client").withConverter(clientConverter);
  const querySnapshot = await getDocs(clients);
  const uids: string[] = querySnapshot.docs
    .filter((doc) => {
      // Include doc if id does not include mock
      // if (doc.data().intravet_id.includes('mock')) console.log("Disclude mock: ", doc.data().intravet_id);
      return !(doc.data().intravet_id.includes('mock'));
    })
    .map((doc) => { return doc.data().intravet_id });
  return uids;
}

/**
 * This will be used to be able to dump Intravet data into firebase
 * @returns List of all the account nos in firebase
 */
export async function getUserAccountNos(): Promise<number[]> {
  const clients = collection(firestore, "client").withConverter(clientConverter);
  const querySnapshot = await getDocs(clients);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const anos: number[] = querySnapshot.docs
    .filter((doc) => {
      // This is for our dummy data
      return !(doc.data().account_no === -1);
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    .map((doc) => { return doc.data().account_no });
  return anos;
}

// export async function deleteUserAccount(intravet_id: number) {
//   const clients = collection(firestore, "client");
//   const pets = collection(firestore, "pets");
//   const appointments = collection(firestore, "appointment");

//   //await deleteDocs();
// }

