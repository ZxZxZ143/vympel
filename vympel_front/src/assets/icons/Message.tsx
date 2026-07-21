import React, {FC} from 'react';
import {IconProps} from "@/assets/icons/type";

const Message: FC<IconProps> = (props) => {
    return (
        <svg {...props} width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5.83334" y="8.75" width="23.3333" height="17.5" rx="2" stroke="#33363F" strokeWidth="2"/>
            <path d="M5.83334 13.125L16.6056 18.5111C17.1686 18.7926 17.8314 18.7926 18.3944 18.5111L29.1667 13.125" stroke="#33363F" strokeWidth="2"/>
        </svg>
    );
};

export default Message;