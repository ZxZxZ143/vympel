import React, {FC} from 'react';
import {IconProps} from "@/assets/icons/type";

const Refresh: FC<IconProps> = (props) => {
    return (
        <svg {...props} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.6667 27.5L18.3334 34.8333L25.6667 42.1667" stroke="#33363F" strokeWidth="3"/>
            <path d="M33.114 15.5834C34.2403 17.5343 34.8333 19.7473 34.8333 22C34.8333 24.2527 34.2403 26.4658 33.114 28.4167C31.9876 30.3676 30.3676 31.9877 28.4166 33.114C26.4657 34.2404 24.2527 34.8334 22 34.8334" stroke="#33363F" strokeWidth="3" strokeLinecap="round"/>
            <path d="M18.3334 16.5L25.6667 9.16667L18.3334 1.83333" stroke="#33363F" strokeWidth="3.5"/>
            <path d="M10.886 28.4166C9.75967 26.4657 9.16669 24.2527 9.16669 22C9.16669 19.7473 9.75967 17.5342 10.886 15.5833C12.0124 13.6324 13.6324 12.0123 15.5834 10.886C17.5343 9.75962 19.7473 9.16664 22 9.16664" stroke="#33363F" strokeWidth="3.5" strokeLinecap="round"/>
        </svg>

    );
};

export default Refresh;