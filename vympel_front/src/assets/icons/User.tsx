import React, {FC} from 'react';
import {IconProps} from "@/assets/icons/type";

const User: FC<IconProps> = (props) => {
    return (
        <svg {...props} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26.3033 27.2628C25.6955 25.5617 24.3564 24.0586 22.4935 22.9865C20.6306 21.9144 18.3481 21.3333 16 21.3333C13.6519 21.3333 11.3695 21.9144 9.50659 22.9865C7.64372 24.0586 6.30457 25.5617 5.69683 27.2628" stroke="#33363F" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="16" cy="10.6667" r="5.33333" stroke="#33363F" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );
};

export default User;