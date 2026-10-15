import {createContext, ReactNode, useEffect, useReducer} from "react";
import {postToastNotification} from "../components/Notifications/ToastNotificationCenter";

type ThemeContextType = {
    mode: string;
    toggleTheme: (theme: string) => void;
};

export const ThemeContext =
    createContext<ThemeContextType | undefined>({} as ThemeContextType);

const themeReducer = (state: any, action: any) => {
    switch (action.type) {
        case "TOGGLE_THEME":
            return {
                ...state,
                mode: action.payload === "dark" ? "dark" : "light",
            };

        default:
            return state;
    }
};

export const ThemeProvider = ({
                                  children,
                              }: {
    children: ReactNode;
}) => {
    const [state, dispatch] = useReducer(themeReducer, {
        mode: "dark",
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", state.mode);
    }, [state.mode]);

    const toggleTheme = (theme: string) => {
        document.documentElement.setAttribute("data-theme", theme);

        postToastNotification({
            type: "success",
            message: "Theme changed successfully",
            duration: 3000,
            title: "Theme Change",
            id: "theme-change-success",
        })

        dispatch({
            type: "TOGGLE_THEME",
            payload: theme,
        });
    };

    return (
        <ThemeContext.Provider
            value={{
                mode: state.mode === undefined ? "dark" : state.mode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};