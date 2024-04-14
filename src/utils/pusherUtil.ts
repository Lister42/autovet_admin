/* eslint-disable prefer-const */
import Pusher, { Channel } from 'pusher-js';
import { adminConverter, appointmentConverter, auth, firestore, messageConverter } from './firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, where, query, getDocs } from 'firebase/firestore';
import { AdminType, ChatInfo, NotificationInfo, PusherDetails } from './types';
import { boolean } from 'zod';

//##DEVELOPMENT VARIABLES**
export const messagesSavedToDB = true;

//===ADMIN===>
export const pusherDetails: PusherDetails = {
  appId: "1562542",
  key: "5c22e8b85c80909c84d5",
  secret: "74623b7c9fdf213bf1be",
  cluster: "us2" 
}
export const currentAdmin = getCurrentAdmin();
export const pusherInstance = connectToPusher();
export const notificationChannelInstance = connectToNotificationChannel();
export let pusherChannels: {[apptID: string]: Channel} = {};
export let observedAppointmentChannels: {[apptID: string]: boolean} = {};
export let appointmentNotificationList: {[apptID: string]: NotificationInfo} = {};
export let processNotification: {[apptID: string]: boolean} = {};

async function connectToPusher() {
  const pusher = await handlePusherCreation();
  pusher.signin();
  return pusher;
}

async function connectToNotificationChannel() {
  const pusher = await pusherInstance;
  const notificationChannel = pusher.subscribe('presence-client-notifications');
  return notificationChannel;
}

//Maybe do if we have more time...
//Need a function that is universally accessible (will always run) so that when triggered, it will update all the other admins notification list to be empty
// async function syncNotifications() {
//   const nChannel = await notificationChannelInstance;
//   nChannel?.bind("client-notification-sync", (apptID: string) => {
//     //Since the boy who called this will have updated all the uid's already, all this guy needs to do to update is pull from the DB
//     console.log("Syncing the update to all admins for the appointment", apptID);
//     //Pull notification list from DB for most recent update.
//   })
// }

//Waits for the admin to sign in
async function waitForAuthUser(): Promise<User> {
  while (!auth.currentUser) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return auth.currentUser;
} 

async function getCurrentAdmin(): Promise<AdminType> {
  const user = await waitForAuthUser();
  const adminCollection = collection(firestore, "admins").withConverter(adminConverter);
  const adminQuerySnapshot = await getDocs(adminCollection);
  const admin: AdminType[] = adminQuerySnapshot.docs
    .filter((doc) => {
      //filter for the current admin ID from the doc
      return (doc.data().uid.includes(user?.uid));
    })
    .map((doc) => {return doc.data()});
  
  if (admin[0]) {
    return admin[0];
  } else {
    throw new Error("Admin not found");
  }
}

//Creates pusher instance and signs the admin into it
async function handlePusherCreation(): Promise<Pusher> { 
  const pusher = new Pusher('5c22e8b85c80909c84d5', {
    cluster: "us2",
    authEndpoint: "/api/pusher/auth",
    userAuthentication: {
        endpoint: "/api/pusher/userAuthenticate",
        transport: "ajax",
        params: {
            user_id: (await currentAdmin).uid,
            first_name: (await currentAdmin).first_name,
            last_name: (await currentAdmin).last_name
        }
    }
  });
  return pusher;
}
