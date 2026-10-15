// styles
import './TabView.css'
import {TabViewButton} from "./TabViewButton";
import React, {Children, useState} from "react";

type TabViewButtonData = {
    key: string;
    title: string;
};

type TabViewProps = {
    title: string;
    buttons: TabViewButtonData[];
    children: React.ReactNode;
};

export const TabView = ({title, buttons, children}: TabViewProps) => {
    const [activeTab, setActiveTab] = useState(buttons[0]?.key);

    const onTabViewButtonClick = (key: string) => {
        setActiveTab(key);
    };

    return (
        <div className="tabViewContainer">
            <div className="tabViewButtonsList">
                {buttons.map((button) => (
                    <TabViewButton
                        key={button.key}
                        title={button.title}
                        active={activeTab === button.key}
                        onClick={() => onTabViewButtonClick(button.key)}
                    />
                ))}
            </div>
            <div className="tabViewContent">
                {React.Children.map(children, (child) => {
                    if (!React.isValidElement(child)) return null;

                    return String(child.key) === String(activeTab)
                        ? child
                        : null;
                })}
            </div>
        </div>
    );
};
