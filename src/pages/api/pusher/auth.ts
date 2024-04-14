import { pusherDetails } from "@/utils/pusherUtil";
import type { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";

export default function auth(req: NextApiRequest, res: NextApiResponse) {
    const pusher = new Pusher({
        appId: pusherDetails.appId,
        key: pusherDetails.key,
        secret: pusherDetails.secret,
        cluster: pusherDetails.cluster
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const channelName = req.body.channel_name;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const socketID = req.body.socket_id;

    //TODO: set up some sort of way to check if the userID is in firebase database

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const auth = pusher.authorizeChannel(socketID, channelName);
    res.json(auth);
}