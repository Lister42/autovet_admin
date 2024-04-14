import { pusherDetails } from "@/utils/pusherUtil";
import type { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";

export default function userAuthenticate(req: NextApiRequest, res: NextApiResponse) {
    const pusher = new Pusher({
        appId: pusherDetails.appId,
        key: pusherDetails.key,
        secret: pusherDetails.secret,
        cluster: pusherDetails.cluster
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const socketID = req.body.socket_id;

   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
   if (req.body.user_id == 'undefined') {
        res.status(403).json({ message: 'Error retrieving auth ID' });
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const user = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            id: req.body.user_id,
            user_info: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                first_name: req.body.first_name,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                last_name: req.body.last_name
            }
        };

        //TODO: function check here

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const auth = pusher.authenticateUser(socketID, user);
        res.json(auth);
    }
}

//TODO: do some sort of error checking to make sure the request is authorized. I.E. the attached ID is within the database. 