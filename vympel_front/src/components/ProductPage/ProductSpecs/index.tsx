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
    dialType: string;
    dialMarking: string;
    powerSource: string;
    strapColor: string;
    dialColor: string;
    packageContents: string;
    watchFeatures: string;
    millimeter: string;
    color: string;
    style: string;
    powerType: string;
    dimensions: string;
    weight: string;
    warrantyMonths: string;
    grams: string;
    months: string;
    claspType: string;
    accessoryCaseMaterial: string;
    insertMaterial: string;
    hasInsert: string;
    length: string;
    yes: string;
    no: string;
};

type Props = {
    product: IProductDetails;
    labels: Labels;
};

const getFeatureName = (feature?: IProductFeature | null) => feature?.name;

export type ProductSpecRow = {
    label: string;
    value: string | number;
};

export const buildProductSpecRows = (product: IProductDetails, labels: Labels): ProductSpecRow[] => {
    const details = product.watchDetails;
    const interiorDetails = product.interiorClockDetails;
    const accessoryDetails = product.accessoryDetails;
    const country = product.brand?.country?.filter(Boolean).join(", ");
    const isAccessory = product.productType === "ACCESSORY" || product.productType === "APPLE_CASE";

    const rows = isAccessory ? [
        {label: labels.claspType, value: accessoryDetails?.claspType},
        {label: labels.accessoryCaseMaterial, value: getFeatureName(accessoryDetails?.caseMaterial)},
        {label: labels.insertMaterial, value: getFeatureName(accessoryDetails?.insertMaterial)},
        {
            label: labels.hasInsert,
            value: accessoryDetails?.hasInsert === true
                ? labels.yes
                : accessoryDetails?.hasInsert === false ? labels.no : undefined,
        },
        {label: labels.color, value: getFeatureName(accessoryDetails?.color)},
        {label: labels.length, value: accessoryDetails?.length},
    ] : interiorDetails ? [
        {label: labels.case, value: getFeatureName(interiorDetails.caseMaterial)},
        {label: labels.country, value: getFeatureName(interiorDetails.productionCountry)},
        {label: labels.color, value: getFeatureName(interiorDetails.color)},
        {label: labels.style, value: getFeatureName(interiorDetails.style)},
        {label: labels.mechanismType, value: getFeatureName(interiorDetails.mechanismType)},
        {label: labels.powerType, value: getFeatureName(interiorDetails.powerType)},
        {label: labels.dimensions, value: interiorDetails.dimensions},
        {label: labels.weight, value: interiorDetails.weightGrams !== null && interiorDetails.weightGrams !== undefined ? `${interiorDetails.weightGrams} ${labels.grams}` : undefined},
        {label: labels.warrantyMonths, value: interiorDetails.warrantyMonths !== null && interiorDetails.warrantyMonths !== undefined ? `${interiorDetails.warrantyMonths} ${labels.months}` : undefined},
    ] : [
        {label: labels.bracelet, value: getFeatureName(details?.strapMaterial)},
        {label: labels.case, value: getFeatureName(details?.caseMaterial)},
        {label: labels.country, value: country},
        {label: labels.gender, value: getFeatureName(details?.gender)},
        {label: labels.glass, value: getFeatureName(details?.glassType)},
        {label: labels.caseSize, value: details?.caseSizeMm !== null && details?.caseSizeMm !== undefined ? `${details.caseSizeMm} ${labels.millimeter}` : undefined},
        {label: labels.stoneInsert, value: getFeatureName(details?.stoneInlay)},
        {label: labels.mechanismType, value: getFeatureName(details?.mechanism)},
        {label: labels.waterResistance, value: getFeatureName(details?.waterResistanceOption) ?? details?.waterResistance},
        {label: labels.dialType, value: getFeatureName(details?.dialType)},
        {label: labels.dialMarking, value: getFeatureName(details?.dialMarking)},
        {label: labels.powerSource, value: getFeatureName(details?.powerSource)},
        {label: labels.strapColor, value: getFeatureName(details?.strapColor)},
        {label: labels.dialColor, value: getFeatureName(details?.dialColor)},
        {label: labels.packageContents, value: details?.packageContents},
        {label: labels.watchFeatures, value: details?.features?.map((feature) => feature.name).filter(Boolean).join(", ")},
    ];

    const visibleRows: ProductSpecRow[] = [];
    for (const row of rows) {
        if (row.value !== null && row.value !== undefined && String(row.value).trim() !== "") {
            visibleRows.push({label: row.label, value: row.value});
        }
    }
    return visibleRows;
};

const ProductSpecs = ({product, labels}: Props) => {
    const rows = buildProductSpecRows(product, labels);

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
