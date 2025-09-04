

export interface RawItem {
    id: number;
    name: string;
    description?: string;
}

export const transformToSelectOptions = (
    items: RawItem[]
): { label: string; value: string }[] | [] => {
    return items.map((item) => ({
        label: item.name,
        value: String(item.id),
    })) || [];
};

interface RawItem2 {
    id: number;
    value: string;
}

export interface OptionsSelect {
    label: string;
    value: string
}

export const transformToIdAndValueSelectOptions = (
    items: RawItem2[]
): OptionsSelect[] | [] => {
    return items.map((item) => ({
        label: item.value,
        value: String(item.id),
    })) || [];
};