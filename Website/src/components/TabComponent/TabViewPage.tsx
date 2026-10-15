//styles
import './TabViewPage.css'
import React from "react";

type TabViewPageProps = {
    children: React.ReactNode,
    title: string,
}

export const    TabViewPage = ({children, title}: TabViewPageProps) => {
    return (
        <div className="tabViewPageContainer">
            <h1 className="tabViewPageTitle">{title}</h1>
            <div className="tabViewPageEntries">
                {children}
            </div>
        </div>
    );
};
