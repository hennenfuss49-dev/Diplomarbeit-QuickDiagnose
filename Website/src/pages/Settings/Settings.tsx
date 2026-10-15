//stles
import './Settings.css'
import {TabView} from "../../components/TabComponent/TabView";
import {TabViewButton} from "../../components/TabComponent/TabViewButton";
import {TabViewPage} from "../../components/TabComponent/TabViewPage";
import {useTheme} from "../../hooks/useTheme";

export const Settings = () => {
    const { toggleTheme, mode } = useTheme();

    return (
        <div>
            <h1>Settings</h1>
            <TabView title={"Settings"}   buttons={[
                { key: "general", title: "General" },
                { key: "security", title: "Security" },
                { key: "services", title: "Services" },
            ]}>
                <TabViewPage key={"services"} title={"Services"} >

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
