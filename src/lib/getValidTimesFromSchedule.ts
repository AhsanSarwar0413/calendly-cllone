import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants";
import { db } from "@/drizzle/db";
import { ScheduleAvailabilityTable } from "@/drizzle/schema";
import { getCalendarEventsTimes } from "@/server/googleCalendar";
import { addMinutes, areIntervalsOverlapping, isFriday, isMonday, isSaturday, isSunday, isThursday, isTuesday, isWednesday, isWithinInterval, setHours, setMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { groupBy } from "lodash";

type Availability = {
    startTime: string,
    endTime: string,
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number]
}

export async function getValidTimesFromSchedule(timesInOrder: Date[], event: {
    clerkUserId: string,
    durationInMinutes: number
}) {
    const start = timesInOrder[0];
    const end = timesInOrder.at(-1);

    console.log("start", start);
    console.log("end", end);

    if (start == null || end == null) return [];

    const schedule = await db.query.ScheduleTable.findFirst({
        where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, event.clerkUserId),
        with: { availabilities: true }
    })
    
    console.log("schedule", schedule);
    if (schedule == null) return [];

    const groupAvailabilities = groupBy(schedule.availabilities, (a: Availability) => a.dayOfWeek)


    const eventTimes = await getCalendarEventsTimes(event.clerkUserId, {
        start,
        end,
    });

    console.log("event times:", eventTimes);
    return timesInOrder.filter(intervalDate => {
        const availabilities = getAvailabilities(groupAvailabilities, intervalDate, schedule.timezone);

        const eventInterval = {
            start: intervalDate,
            end: addMinutes(intervalDate, event.durationInMinutes)
        }

        return eventTimes.every(eventTime => {
            return !areIntervalsOverlapping(eventTime, eventInterval)
        }) && availabilities.some(availability => {
            return isWithinInterval(eventInterval.start, availability) && isWithinInterval(eventInterval.end, availability)
        })
    })
}

function getAvailabilities(
    groupedAvailabilities: Partial<
        Record<
            (typeof DAYS_OF_WEEK_IN_ORDER)[number],
            (typeof ScheduleAvailabilityTable.$inferSelect)[]
        >
    >,
    date: Date,
    timezone: string
) {
    let availabilities:
        | (typeof ScheduleAvailabilityTable.$inferSelect)[]
        | undefined

    if (isMonday(date)) {
        availabilities = groupedAvailabilities.monday
    }
    if (isTuesday(date)) {
        availabilities = groupedAvailabilities.tuesday
    }
    if (isWednesday(date)) {
        availabilities = groupedAvailabilities.wednesday
    }
    if (isThursday(date)) {
        availabilities = groupedAvailabilities.thursday
    }
    if (isFriday(date)) {
        availabilities = groupedAvailabilities.friday
    }
    if (isSaturday(date)) {
        availabilities = groupedAvailabilities.saturday
    }
    if (isSunday(date)) {
        availabilities = groupedAvailabilities.sunday
    }

    if (availabilities == null) return []

    return availabilities.map(({ startTime, endTime }) => {
        const start = fromZonedTime(
            setMinutes(
                setHours(date, parseInt(startTime.split(":")[0])),
                parseInt(startTime.split(":")[1])
            ),
            timezone
        )

        const end = fromZonedTime(
            setMinutes(
                setHours(date, parseInt(endTime.split(":")[0])),
                parseInt(endTime.split(":")[1])
            ),
            timezone
        )

        return {
            start,
            end,
        }
    })
}
