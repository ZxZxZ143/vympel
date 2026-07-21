import React, {FC} from 'react';
import {IconProps} from "@/assets/icons/type";

const ArrowRight: FC<IconProps> = (props) => {
    return (
        <svg {...props} width="25" height="12" viewBox="0 0 25 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M24.5303 6.05328C24.8232 5.76039 24.8232 5.28551 24.5303 4.99262L19.7574 0.21965C19.4645 -0.0732433 18.9896 -0.0732434 18.6967 0.21965C18.4038 0.512543 18.4038 0.987417 18.6967 1.28031L22.9393 5.52295L18.6967 9.76559C18.4038 10.0585 18.4038 10.5334 18.6967 10.8263C18.9896 11.1191 19.4645 11.1191 19.7574 10.8263L24.5303 6.05328ZM0 5.52295L-6.55671e-08 6.27295L24 6.27295L24 5.52295L24 4.77295L6.55671e-08 4.77295L0 5.52295Z"
                fill="#33363F"/>
        </svg>
    );
};

export default ArrowRight;