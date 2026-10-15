// styles
import './Sidebar.css'
import {NavLink} from "react-router-dom";
import DashboardIcon from '../assets/img/dashboard_icon.svg'
import ErrorIcon from '../assets/img/error_icon.svg'
import HistoryIcon from '../assets/img/history_icon.svg'
import LiveDataIcon from '../assets/img/livedata_icon.svg'
import SettingsIcon from '../assets/img/settings_icon.svg'


export const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="sidebar-content">
                <div className="profile-management">
                    <h4>Kangaroo Inc.</h4>
                    <h6>admin@kangaroo.com</h6>
                </div>

                {/*<div className="searchbar">*/}
                {/*    <span className="search-icon">⌕</span>*/}
                {/*    <input type="text" placeholder="Search"/>*/}
                {/*</div>*/}

                <div className="top-section">
                    <div className="sidebar-divider"/>
                    <ul>
                        <li>
                            <NavLink to="/" className="sidebarBtn">
                                <img src={DashboardIcon}/>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/liveData" className="sidebarBtn">
                                <img src={LiveDataIcon}/>
                                <span>Live Data</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/history" className="sidebarBtn">
                                <img src={HistoryIcon}/>
                                <span>History</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/errorCodes" className="sidebarBtn">
                                <img src={ErrorIcon}/>
                                <span>Error Codes (DTC)</span>
                            </NavLink>
                        </li>
                    </ul>

                </div>

                <div className="bottom-section">
                    <div className="sidebar-divider"/>
                    <ul>
                        <li>
                            <NavLink to="/settings" className="sidebarBtn">
                                <img src={SettingsIcon}/>
                                <span>Settings</span>
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
