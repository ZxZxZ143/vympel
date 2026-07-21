import {FC, PropsWithChildren} from "react";
import {cn} from "@/lib/utils";

type CardProps = {
    className?: string;
}

const Card: FC<PropsWithChildren<CardProps>> = ({className, children}) => {
    return (
        <div
            className={
                cn("flex justify-center items-center w-fit border overflow-hidden border-border-default bg-surface-card rounded-2xl",
                    className)}>
            {
                children
            }
        </div>
    );
};

export default Card;