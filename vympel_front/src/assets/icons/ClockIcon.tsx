import React, {FC} from 'react';
import {IconProps} from "@/assets/icons/type";

const ClockIcon: FC<IconProps> = (props) => {
    return (
        <svg {...props} width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.625 4C19.0453 4 24.25 9.20469 24.25 15.625C24.25 22.0453 19.0453 27.25 12.625 27.25C6.20469 27.25 1 22.0453 1 15.625C1 9.20469 6.20469 4 12.625 4ZM12.625 7.52051C12.0728 7.52051 11.6252 7.96837 11.625 8.52051V15.375C11.6252 16.0652 12.1848 16.625 12.875 16.625H17.1455C17.6977 16.625 18.1453 16.1771 18.1455 15.625C18.1453 15.0729 17.6977 14.625 17.1455 14.625H13.625V8.52051C13.6248 7.96837 13.1772 7.52051 12.625 7.52051Z" fill="#222222"/>
        </svg>
    );
};

export default ClockIcon;