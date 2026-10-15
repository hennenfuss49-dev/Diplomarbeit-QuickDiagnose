//styles
import './TabViewButton.css'

type TabViewButtonProps = {
    title: string,
    onClick?: () => void,
    active: boolean,
}

export const TabViewButton = ({title, onClick, active}: TabViewButtonProps) => {
    return (
        <button onClick={onClick} className={active ? "active tabViewButton" : "tabViewButton"}>
            {title}
        </button>
    );
};
