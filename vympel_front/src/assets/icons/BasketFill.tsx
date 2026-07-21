import React, {FC} from 'react';
import {IconProps} from "@/assets/icons/type";

const BasketFill: FC<IconProps> = (props) => {
    return (
        <svg {...props} width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.66666 8.66669H13.6051C14.3551 8.66669 14.73 8.66669 15.0013 8.87848C15.2726 9.09028 15.3635 9.45406 15.5454 10.1816L16.5759 14.3035C16.9396 15.7586 17.1215 16.4862 17.6641 16.9098C18.2066 17.3334 18.9565 17.3334 20.4564 17.3334H21.6667" stroke="#33363F" strokeWidth="3" strokeLinecap="round"/>
            <path d="M39 36.8333H15.7749C14.5086 36.8333 13.8755 36.8333 13.5762 36.418C13.2769 36.0027 13.4771 35.4021 13.8775 34.2009L14.255 33.0684C14.695 31.7484 14.915 31.0883 15.4388 30.7108C15.9625 30.3333 16.6583 30.3333 18.0497 30.3333H30.3333" stroke="#33363F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M36.3676 31.4167H19.1418C18.1506 31.4167 17.309 30.6906 17.1635 29.7102L15.4218 17.9701C15.2874 17.064 15.9895 16.25 16.9056 16.25H42.877C43.6009 16.25 44.085 16.9953 43.7906 17.6566L38.1949 30.2299C37.8736 30.9516 37.1576 31.4167 36.3676 31.4167Z" fill="#33363F" stroke="#33363F" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="35.2083" cy="43.875" r="2.70833" fill="#33363F"/>
            <circle cx="17.875" cy="43.875" r="2.70833" fill="#33363F"/>
        </svg>
    );
};

export default BasketFill;