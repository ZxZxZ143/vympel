import {FC} from "react";
import {cn} from "@/lib/utils";
import Card from "@/components/ui/shared/Card";

type Props = {
    className?: string;
    isCatalog?: boolean;
}

const GoodCardSkeleton: FC<Props> = ({className, isCatalog = false}) => {
    return (
        <article
            className={cn(
                "w-full min-w-0",
                className
            )}
        >
            <div
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 rounded-2xl"
            >
                <Card className="w-full aspect-27/37 skeleton"/>

                <div className="mt-4">
                    <div className="h-7 w-6/7 bg-surface-card skeleton rounded-sm" />
                    <div className="mt-2 skeleton h-5.5 w-3/4 rounded-sm" />
                    <div className="flex items-center justify-between mt-6 rounded-sm">
                        <div className="skeleton h-8.5 w-1/2 rounded-sm" />
                        {
                            isCatalog && (
                                <div className="flex gap-2 w-1/2 justify-end">
                                    <div className="w-1/3 aspect-square rounded-full skeleton"/>
                                    <div className="w-1/3 aspect-square rounded-full skeleton"/>
                                </div>
                            )
                        }

                    </div>
                </div>
            </div>
        </article>
    );
};

export default GoodCardSkeleton;
