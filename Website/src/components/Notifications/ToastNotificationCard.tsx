// styles
import './ToastNotificationCard.css'
import successIcon from '../../assets/img/notifications/success_icon.svg'
import warningIcon from '../../assets/img/notifications/warning_icon.svg'
import infoIcon from '../../assets/img/notifications/info_icon.svg'
import cancelIcon from '../../assets/img/notifications/cancel_icon.svg'

export interface ToastNotification {
    id: string;
    type: "success" | "warning" | "info" | "cancel",
    message: string,
    duration?: number
    title: string,
}

type ToastNotificationCardProps = {
    toastNotification: ToastNotification,
}

export const ToastNotificationCard = ({toastNotification}: ToastNotificationCardProps) => {
    let icon;

    switch (toastNotification.type) {
        case "success":
            icon = successIcon;
            break;
        case "warning":
            icon = warningIcon;
            break;
        case "info":
            icon = infoIcon;
            break;
        case "cancel":
            icon = cancelIcon;
            break;
    }

    return (
        <div className="toastContainer"   style={{
            animationDuration: `${toastNotification.duration ?? 4000}ms`,
        }}>
            <div className="toastType">
                <img src={icon} alt="success"/>
            </div>
            <div className="toastContent">
                <span className="toastTitle">{toastNotification.title}</span>
                <span className="toastMessage">{toastNotification.message}</span>
            </div>
        </div>
    );
};

