import type { FilterKey, ItemType } from "./types";

export const OPS_API_BASE =
  process.env.NEXT_PUBLIC_TEXAXES_OPS_URL?.replace(/\/+$/, "") || "";

export const FILTER_OPTIONS: Array<[FilterKey, string]> = [
  ["all", "All"],
  ["attention", "Attention"],
  ["upcoming", "Upcoming"],
  ["unpaid", "Unpaid"],
  ["checked_in", "Checked In"],
  ["completed", "Completed"],
  ["no_show", "No Show"],
  ["tax_exempt", "Tax Exempt"],
];

export const ITEM_PRESETS: Array<{
  key: string;
  label: string;
  item_type: ItemType;
  description: string;
  unit_price: number;
  taxable: boolean;
  defaultQuantity?: number;
  requiresSize?: boolean;
}> = [
  {
    key: "coke",
    label: "Coke",
    item_type: "drink",
    description: "Coke",
    unit_price: 3.5,
    taxable: true,
    defaultQuantity: 1,
  },
  {
    key: "water",
    label: "Water",
    item_type: "drink",
    description: "Water",
    unit_price: 3.0,
    taxable: false,
    defaultQuantity: 1,
  },
  {
    key: "shirt",
    label: "Shirt",
    item_type: "retail",
    description: "Tex Axes Shirt",
    unit_price: 35,
    taxable: true,
    defaultQuantity: 1,
    requiresSize: true,
  },
  {
    key: "axe",
    label: "Retail Axe",
    item_type: "axe",
    description: "Retail Axe",
    unit_price: 125,
    taxable: true,
    defaultQuantity: 1,
  },
];
