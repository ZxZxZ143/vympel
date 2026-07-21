import React, {FC} from 'react';
import {IconProps} from "@/assets/icons/type";

const Earth: FC<IconProps> = (props) => {
    return (
        <svg {...props} width="40" height="33" viewBox="0 0 40 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19.5" cy="16.5" r="12.5" stroke="#33363F" strokeWidth="2"/>
            <ellipse cx="19.5" cy="16.5" rx="4.5" ry="12.5" stroke="#33363F" strokeWidth="2"/>
            <path d="M7 17H32" stroke="#33363F" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );
};

export default Earth;