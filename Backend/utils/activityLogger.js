import { push, ref, set } from "firebase/database";
import { db } from "../config/firebase.js";

export const createActivityLog = async ({
    businessId,
    branchId = null,
    user,
    type,
    activity,
    entity = null,
    ipAddress = null,
}) => {
    if (!businessId || !user || !type || !activity) return;

    const logRef = push(
        ref(db, `salonandspa/activityLogs/${businessId}`)
    );

    const logData = {
        businessId,
        branchId,
        createdAt: Date.now(),
        type,
        activity,
        ipAddress,
        updatedBy: {
            userId: user.id || user.uid,
            name: user.name || "Unknown",
            role: user.role || "unknown",
        },
        entity,
    };

    await set(logRef, logData);
};
