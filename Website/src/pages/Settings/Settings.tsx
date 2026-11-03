//stles
import './Settings.css'
import {TabView} from "../../components/TabComponent/TabView";
import {TabViewButton} from "../../components/TabComponent/TabViewButton";
import {TabViewPage} from "../../components/TabComponent/TabViewPage";
import {useTheme} from "../../hooks/useTheme";
import {getConnectionType, setConnectionType} from "../../Services/ServiceFactory";
import {useEffect, useState} from "react";

export const Settings = () => {
    const { toggleTheme, mode } = useTheme();

    const [currentConnectionType, setCurrentConnectionType] = useState(() => {
        return getConnectionType();
    });

    return (
        <div>
            <h1>Settings</h1>
            <TabView title={"Settings"}   buttons={[
                { key: "general", title: "General" },
                { key: "security", title: "Security" },
                { key: "services", title: "Services" },
            ]}>
                <TabViewPage key={"services"} title={"Services"} >
                    <div className={"tabViewPageEntry"}>
                        <span>Connection Service: </span>
                        <select id="service" name="service"   value={currentConnectionType}
                                onChange={(e) => {
                                    setConnectionType(e.target.value as "websocket" | "bluetooth")
                                    setCurrentConnectionType(e.target.value as "websocket" | "bluetooth")
                                }}>
                            <option value="websocket">Websocket</option>
                            <option value="bluetooth">Bluetooth</option>
                        </select>
                    </div>
                </TabViewPage>
                <TabViewPage key={"security"} title={"Security"} >

                </TabViewPage>
                <TabViewPage key={"general"} title={"General"} >
                    <div className={"tabViewPageEntry"}>
                        <span>Appearance: </span>
                        <select id="appearance" name="appearance"   value={mode}
                                onChange={(e) => toggleTheme(e.target.value)}>
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </div>
                </TabViewPage>
            </TabView>
        </div>
    );
};
