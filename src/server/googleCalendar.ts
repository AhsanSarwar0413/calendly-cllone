import { clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";
import "use-server"
import { startOfDay, endOfDay, addMinutes } from "date-fns";

export async function getCalendarEventsTimes(
    clerkUserId: string,
    { start, end }: { start: Date, end: Date }
) {
    const oAuthClient = await getOAuthClient(clerkUserId);

    const events = await google.calendar("v3").events.list({
        auth: oAuthClient,
        calendarId: "primary",
        eventTypes: ["default"],
        singleEvents: true,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        maxResults: 2500,
    })

    console.log("events in google calendar", events);

    return events.data.items?.map(event => {
        if (event.start?.date != null && event.end?.date != null) {
            //event is taking the entire day, the entire day is completely filled with event
            return {
                start: startOfDay(event.start.date),
                end: endOfDay(event.end.date)
            }
        }

        if (event.start?.dateTime != null && event.end?.dateTime != null) {
            return {
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime)
            }
        }
    }).filter(date => date != null) || []

}

export async function createCalendarEvent({
    clerkUserId,
    guestName,
    guestEmail,
    startTime,
    guestNotes,
    durationInMinutes,
    eventName,
}: {
    eventId: string;
    clerkUserId: string;
    startTime: Date;
    guestEmail: string;
    timezone: string;
    guestName?: string | undefined;
    guestNotes?: string | undefined;
    durationInMinutes: number
    eventName: string
}) {

    const oAuthClient = await getOAuthClient(clerkUserId);
    const calendarUser = await clerkClient().users.getUser(clerkUserId);
    if (calendarUser.primaryEmailAddress == null) {
        throw new Error("Clerk User has no Email Address");
    }

    const calendarEvent = await google.calendar("v3").events.insert({
        calendarId: "primary",
        auth: oAuthClient,
        sendUpdates: "all",
        requestBody: {
            attendees: [
                {
                    email: guestEmail,
                    displayName: guestName
                },
                {
                    email: calendarUser.primaryEmailAddress.emailAddress,
                    displayName: calendarUser.fullName,
                    responseStatus: "accepted"
                }
            ],
            description: guestNotes ? `Additional Details: ${guestNotes}` : 'undefined',
            start: {
                dateTime: startTime.toISOString(),
            },
            end: {
                dateTime: addMinutes(startTime, durationInMinutes).toISOString(),
            },
            summary: `${guestName} + ${calendarUser.fullName}: ${eventName}`
        }
    })

    console.log("calendar event :", calendarEvent.data, "and", "calendar event:", calendarEvent);

    return calendarEvent.data;
}

async function getOAuthClient(clerkUserId: string) {
    const token = await clerkClient().users.getUserOauthAccessToken(clerkUserId, "oauth_google");
    console.log("o auth token:", token);
    if (token.data.length === 0 || token.data[0].token == null) {
        return
    }
    
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URL
    );

    console.log("client is :", client);

    client.setCredentials({ access_token: token.data[0].token });

    return client;
}
