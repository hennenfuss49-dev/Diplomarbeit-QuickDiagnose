// styles
import './Card.css'
import React from "react";

interface CardProps extends React.PropsWithChildren {
    title: string;
    className?: string;
}

export const Card = ({title, children}: CardProps) => {
    return (
        <div className="card" draggable>
            <span className="cardTitle" >{title}</span>
            {children}
        </div>
    );
};
