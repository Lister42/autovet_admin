import type { AdminType, AppointmentType, ChatInfo, MessageType } from '@/utils/types';
import React, { useEffect, useRef, useState } from 'react';
import { pusherInstance, pusherChannels, currentAdmin, observedAppointmentChannels, notificationChannelInstance, messagesSavedToDB } from '@/utils/pusherUtil';
import type { Channel } from 'pusher-js';
import { Timestamp, addDoc, collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { firestore, messageConverter } from '@/utils/firebase';


export default function ChatBox(appointment: AppointmentType) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatInfo[]>([]);
    const [channel, setChannel] = useState<Channel>();
    const [notificationsChannel, setNotificationsChannel] = useState<Channel>();
    const [admin, setAdmin] = useState<AdminType>();
    const [addMessage, setAddMessage] = useState(Date.now());
    const [curReceivedMessage, setCurReceivedMessage] = useState<ChatInfo>();
    const messageEndRef = useRef<HTMLDivElement>(null);

    //#DEVELOPMENT#: hard constraint to control whether messages get added to the database
    const addMessagesToDB = messagesSavedToDB; 

    //This is done so to make sure it is only run once.
    useEffect(() => {
      if (curReceivedMessage) {
        setMessages([...messages, curReceivedMessage]);
      } else {
        console.log("curReceivedMessage was undefined", curReceivedMessage);
      }
    }, [addMessage])
    //Ran once when mounting chatbox
    useEffect(() => {
        //Switch the chat box to current appointment's channel.
        async function loadChannel() {
            const pusher = await pusherInstance;
            
            //May want to do this stuff in appointment details, we'll have to wait and see
            handleAppointmentObservation();

            const nChannel = await notificationChannelInstance;
            setNotificationsChannel(nChannel);

            const result = pusher.subscribe("presence-client-"+appointment.appointment_id);
            pusherChannels[appointment.appointment_id] = result; //idk if I actually have to do this, nothing that I know is dependent on it

            //==> Initialize behavior when receiving a message.
            result.bind('client-handled-message', (data: ChatInfo) => {
              setAddMessage(Date.now());
              setCurReceivedMessage(data);
            });

            setChannel(result);
        }
        void loadChannel();
        
        async function loadAdmin() {
            const result = await currentAdmin;
            setAdmin(result);
        }
        void loadAdmin();

        //Load messages that were loaded from database.
        async function loadMessagesFromDB() {
          const messageCollection = collection(firestore, "messages").withConverter(messageConverter);
          const messageQuery = query(messageCollection, where("appointment_id", "==", appointment.appointment_id));
          const messageSnapshot = await getDocs(messageQuery);
          const loadedMessages: MessageType[] = messageSnapshot.docs.map((doc) => {return doc.data()});
          const sortedMessages = loadedMessages?.sort((a, b) => a.message_id - b.message_id);
          const result: ChatInfo[] = sortedMessages?.map((val: MessageType) => {  
            const data: ChatInfo = {
              username: val.name,
              message: val.content,
              time_sent: val.timestamp.toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                hourCycle: 'h12'
              }),
              uid: val.uid,
              shouldNotify: val.shouldNotify
            }
            return data;
          });
          setMessages([...result]);
        }
        void loadMessagesFromDB();
    }, []);

    //Used to auto-scroll to the bottom of the messages when a new one is received.
    useEffect(() => {
      if (messageEndRef.current) {
          messageEndRef.current.scrollIntoView({behavior: 'smooth'})
      }
    }, [messages])
    
    function handleAppointmentObservation() {
      //Sets all observed values of all other appointments to false
      for (const key in observedAppointmentChannels) {
        if (Object.prototype.hasOwnProperty.call(observedAppointmentChannels, key)) {
          observedAppointmentChannels[key] = false;
        }
      }
      //Admin is now viewing only this appointment
      observedAppointmentChannels[appointment.appointment_id] = true;
    }

    //Simple time format string
    function currentTimeToString() {
        const now = new Date();
        const dateString = now.toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            hourCycle: 'h12'
          })
        return dateString;
    }

    //Adds message to database
    async function addMessageToDatabase(data: ChatInfo) {
      if (!addMessagesToDB) return;
      const messageCollection = collection(firestore, 'messages');
      await addDoc(messageCollection, {
        appointment_id: appointment.appointment_id,
        content: data.message,
        message_id: messages.length,
        name: data.username,
        timestamp: Timestamp.fromDate(new Date()),
        uid: data.uid,
        shouldNotify: data.shouldNotify
      });
    }

    //Update all the messages that are not this appt to NOT should notify (bc they have seen)
    async function updateShouldNotifyInDB() {
      const messageQuery = query(collection(firestore, 'messages'), where('uid', '!=', admin?.uid));
      try {
        const querySnapshot = await getDocs(messageQuery);
        const updatePromises: any[] = [];
        querySnapshot.docs.forEach((doc) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const updatePromise = updateDoc(doc.ref, {'shouldNotify': false});
          updatePromises.push(updatePromise);
        })
        //Run update promises in parallel using Promise.all()
        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Error updating documents:", error);
      }
    } 


    //Asserts the the sent message follows certain conditions
    function messageIsValidated() {
      if (message === "") {
        return false;
      }
      //add any other cases of contains or something for filtering
      return true;
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        //Make sure format of input is valid
        if (!messageIsValidated()) return;

        const data: ChatInfo = {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            username: `Admin: ${admin?.first_name} `,
            message: message,
            time_sent: currentTimeToString(),
            uid: admin?.uid,
            shouldNotify: true
        }

        //Send message to all connected users to channel
        channel?.trigger('client-handled-message', data);

        // Make all new messages no longer new
        const viewedMessages = messages.map((val) => {
          val.shouldNotify = false;
        })

        //Update the the current messages current instance
        setMessages([...messages, data]);

        //Reset the displayed message back to empty
        setMessage('');

        void addMessageToDatabase(data);

        //Set all messages in database excluding THIS appts to no longer be shown as "new"
        void updateShouldNotifyInDB();

        //Sending a message gets rid of the notification, so update all the admins list to be up to date.
        //void updateAppointmentNotificationListInDB()

        //#######################
        //==> Notification shtuff
        //General notification for everyone connected
        notificationsChannel?.trigger('client-create-message-notification', appointment.appointment_id);
        
        const textMessage = {
          apptID: appointment.appointment_id,
          message: data.message,
          senderName: data.username
        }

        //Will also run this, which is only on client side, which will send them text message if they aren't viewing appointment
        notificationsChannel?.trigger('client-text-message-notification-' + appointment.client_id, textMessage);
    }
    return (
      <div className="h-[12rem] md:h-[13rem] lg:h-[20rem] xl:h-[38rem] 2xl:h-[40rem] border border-gray-800 bg-neutral rounded-lg">
        <div className="p-3 bg-neutral-focus rounded-t-md">
          <h1 className="text-center">Chat</h1>
        </div>
        <div className="px-3 h-1/3 md:h-2/5 lg:h-3/5 xl:h-[30rem] 2xl:h-4/5 overflow-auto overscroll-none">
          <ul className="h-full">
            {messages.map((message, index) => (
              <li key={index}>
                { message.uid == admin?.uid ? (
                <div className="chat chat-end">
                  <div className="chat-header">
                    {message.username}
                    <time className="test-xs opacity-50">{message.time_sent}</time>
                  </div>
                  <div className="chat-bubble chat-bubble-primary">
                    {message.message}
                  </div>
                </div>
                ) : (
                <div>
                  {message.shouldNotify ? (
                      <span className='text-blue-300 text-sm'>---New Message---</span>
                    ) : (<></>)}
                  <div className="chat chat-start">
                    <div className="chat-header">
                      {message.username}
                      <time className="test-xs opacity-50">{message.time_sent}</time>
                    </div>
                    <div className="chat-bubble chat-bubble-secondary">
                      {message.message}
                    </div>
                  </div>
                </div>
                ) }
              </li>
            ))}
            <div ref={messageEndRef}/>
          </ul>
        </div> 
        {/* Input */}
        <form className="mt-4 px-3 bottom-0 left-0 w-full" onSubmit={handleSubmit}>
          <div className="flex flex-row">
            <input 
              type="text" 
              onChange={(e) => setMessage(e.target.value)} 
              className="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg rounded-e-none bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
              value={message}
              placeholder="Message" />
            <button className="btn btn-primary rounded-s-none" type="submit">Send</button>
          </div>
        </form>
        </div>
      
    )
}