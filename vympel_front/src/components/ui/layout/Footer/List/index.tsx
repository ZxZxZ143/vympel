import React, {FC} from 'react';
import {FooterListType} from "@/components/ui/layout/Footer/type";
import {Link} from "@/i18n/navigation";
import {Text} from "@/components/ui/shared/text";

type Props = {
    items: Array<FooterListType>
}

const FooterList: FC<Props> = ({items}) => {
    return (
        <ul className="flex flex-col gap-1 sm:gap-3">
            {items.map((item, i) => (
                <li key={i} className="w-full">
                    <Link href={item.link} className="flex min-h-10 w-full items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 sm:min-h-11">
                        <Text font="footer" weight="regular" size="bodySm" colors="headingPrimary" className="leading-snug hover:underline">
                            {item.text}
                        </Text>
                    </Link>
                </li>
            ))}
        </ul>
    );
};

export default FooterList;
