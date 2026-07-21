"use client";

import SmartSearch from "@/components/ui/shared/SmartSearch";

type QuickSearchProps = {
    onOpen?: () => void;
};

const QuickSearch = ({onOpen}: QuickSearchProps) => (
    <SmartSearch variant="header" onOpen={onOpen}/>
);

export default QuickSearch;
