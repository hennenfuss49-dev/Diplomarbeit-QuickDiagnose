import "./ToastNotificationCenter.css";
import { createPortal } from "react-dom";
import {
    ToastNotification,
    ToastNotificationCard,
} from "./ToastNotificationCard";
import { useEffect, useState } from "react";

let addToastExternal: ((toast: ToastNotification) => void) | null = null;
let removeToastExternal: ((toast: ToastNotification) => void) | null = null;

export function postToastNotification(toastNotification: ToastNotification) {
    addToastExternal?.(toastNotification);
    setTimeout(() => {
        removeToastExternal?.(toastNotification);
    }, toastNotification.duration);
}

export const ToastNotificationCenter = () => {
    const [toastNotifications, setToastNotifications] =
        useState<ToastNotification[]>([]);

    useEffect(() => {
        addToastExternal = (toastNotification) => {
            setToastNotifications((prev) => [
                ...prev,
                toastNotification,
            ]);
        };

        removeToastExternal = (toastNotification) => {
            setToastNotifications(
                (prev) =>
                    prev.filter((toast) => toast.id !== toastNotification.id)
            )
        }

        return () => {
            addToastExternal = null;
        };
    }, []);

    return createPortal(
        <div className="notificationContainer">
            <button
                onClick={() => {
                    postToastNotification({
                        id: "toast-success-001",
                        type: "success",
                        message: "Your changes have been saved successfully.",
                        duration: 4000,
                        title: "Success",
                    });

                    postToastNotification({
                        id: "toast-warning-001",
                        type: "warning",
                        title: "Warning",
                        message: "Some fields may need your attention.",
                        duration: 5000,
                    });

                    postToastNotification({
                        id: "toast-info-001",
                        type: "info",
                        title: "Information",
                        message: "A new software update is available.",
                        duration: 4000,
                    });

                    postToastNotification({
                        id: "toast-error-001",
                        type: "cancel",
                        title: "Error",
                        message: "Something went wrong while saving your changes.",
                        duration: 6000,
                    });
                }}
            >
                Test
            </button>

            {toastNotifications.map((toastNotification) => (
                <ToastNotificationCard
                    key={toastNotification.id}
                    toastNotification={toastNotification}
                />
            ))}
        </div>,
        document.body
    );
};