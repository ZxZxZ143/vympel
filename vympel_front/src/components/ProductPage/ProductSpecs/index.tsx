import {IProductDetails, IProductFeature} from "@/api/types/ProductTypes";
import {Text} from "@/components/ui/shared/text";

type Labels = {
    bracelet: string;
    case: string;
    country: string;
    mechanismType: string;
    gender: string;
    glass: string;
    caseSize: string;
    waterResistance: string;
    stoneInsert: string;
    millimeter: string;
    color: string;
    style: string;
    powerType: string;
    dimensions: string;
    weight: string;
    warrantyMonths: string;
    grams: string;
    months: string;
};

type Props = {
    product: IProductDetails;
    labels: Labels;
};

const getFeatureName = (feature?: IProductFeature | null) => feature?.name;

const ProductSpecs = ({product, labels}: Props) => {
    const details = product.watchDetails;
    const interiorDetails = product.interiorClockDetails;
    const country = product.brand?.country?.filter(Boolean).join(", ");

    const rows = (
        interiorDetails ? [
            {label: labels.case, value: getFeatureName(interiorDetails.caseMaterial)},
            {label: labels.country, value: getFeatureName(interiorDetails.productionCountry)},
            {label: labels.color, value: getFeatureName(interiorDetails.color)},
            {label: labels.style, value: getFeatureName(interiorDetails.style)},
            {label: labels.mechanismType, value: getFeatureName(interiorDetails.mechanismType)},
            {label: labels.powerType, value: getFeatureName(interiorDetails.powerType)},
            {label: labels.dimensions, value: interiorDetails.dimensions},
            {label: labels.weight, value: interiorDetails.weightGrams ? `${interiorDetails.weightGrams} ${labels.grams}` : undefined},
            {label: labels.warrantyMonths, value: interiorDetails.warrantyMonths ? `${interiorDetails.warrantyMonths} ${labels.months}` : undefined},
        ] : [
            {label: labels.bracelet, value: getFeatureName(details?.strapMaterial)},
            {label: labels.case, value: getFeatureName(details?.caseMaterial)},
            {label: labels.country, value: country},
            {label: labels.gender, value: getFeatureName(details?.gender)},
            {label: labels.glass, value: getFeatureName(details?.glassType)},
            {label: labels.caseSize, value: details?.caseSizeMm ? `${details.caseSizeMm} ${labels.millimeter}` : undefined},
            {label: labels.stoneInsert, value: getFeatureName(details?.stoneInlay)},
            {label: labels.mechanismType, value: getFeatureName(details?.mechanism)},
            {label: labels.waterResistance, value: details?.waterResistance},
        ]
    ).filter((row) => Boolean(row.value));

    if (!rows.length) {
        return null;
    }

    return (
        <section className="min-w-0">
            <dl className="grid min-w-0 gap-product-spec-row">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1"
                    >
                        <dt className="shrink-0">
                            <Text
                                as="span"
                                size="bodyLg"
                                weight="medium"
                                colors="primary"
                                className="whitespace-nowrap leading-snug sm:leading-none"
                            >
                                {row.label}:
                            </Text>
                        </dt>
                        <dd className="min-w-0 flex-1">
                            <Text
                                as="span"
                                colors="primary"
                                size="bodyLg"
                                weight="light"
                                className="product-long-copy leading-snug sm:leading-none"
                            >
                                {row.value}
                            </Text>
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
};

export default ProductSpecs;
