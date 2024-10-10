"use server"

import { eventFormSchema } from "@/schema/events"
import { z } from "zod"
import "use-server"
import { db } from "@/drizzle/db";
import { auth } from "@clerk/nextjs/server";
import { EventTable } from "@/drizzle/schema";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

export async function createEvent(unsafeData: z.infer<typeof eventFormSchema>): Promise<{ error: boolean } | undefined> {
    const { success, data } = eventFormSchema.safeParse(unsafeData);
    const { userId } = auth();

    if (!success || userId == null) {
        return {
            error: true
        }
    }

    await db.insert(EventTable).values({ ...data, clerkUserId: userId });

    redirect("/events");
}

export async function updateEvent(
    id: string,
    unsafeData: z.infer<typeof eventFormSchema>
): Promise<{ error: boolean } | undefined> {
    const { success, data } = eventFormSchema.safeParse(unsafeData);
    const { userId } = auth();

    if (!success || userId == null) {
        return {
            error: true
        }
    }

    const { rowCount } = await db
        .update(EventTable)
        .set({ ...data })
        .where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)))

    if (rowCount == 0) {
        return {
            error: true
        }
    }


    redirect("/events");
}

export async function deleteEvent(
    id: string,
): Promise<{ error: boolean } | undefined> {
    const { userId } = auth();
    if (userId == null) {
        return {
            error: true
        }
    }
    const { rowCount } = await db
        .delete(EventTable)
        .where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)))

    if (rowCount == 0) {
        return {
            error: true
        }
    }


    redirect("/events");
}