export const propertyTypeMap: Record<number, string> = {
    1: "propertyTypeMap.apartment",
    2: "propertyTypeMap.bungalow",
    3: "propertyTypeMap.cabin",
    4: "propertyTypeMap.condominium",
    5: "propertyTypeMap.guesthouse",
    6: "propertyTypeMap.house",
    7: "propertyTypeMap.guest_suite",
    8: "propertyTypeMap.townhouse",
    9: "propertyTypeMap.vacation_home",
    10: "propertyTypeMap.boutique_hotel",
    11: "propertyTypeMap.nature_lodge",
    12: "propertyTypeMap.hostel",
    13: "propertyTypeMap.chalet",
    14: "propertyTypeMap.dorm",
    15: "propertyTypeMap.villa",
    16: "propertyTypeMap.other",
    17: "propertyTypeMap.bed_and_breakfast",
    18: "propertyTypeMap.studio",
    19: "propertyTypeMap.hotel",
    20: "propertyTypeMap.resort",
    21: "propertyTypeMap.castle",
    22: "propertyTypeMap.aparthotel",
    23: "propertyTypeMap.boat",
    24: "propertyTypeMap.cottage",
    25: "propertyTypeMap.camping",
    26: "propertyTypeMap.serviced_apartment",
    27: "propertyTypeMap.loft",
    28: "propertyTypeMap.hut",
    29: "propertyTypeMap.barn",
    30: "propertyTypeMap.cave",
    31: "propertyTypeMap.dome_house",
    32: "propertyTypeMap.earthhouse",
    33: "propertyTypeMap.farm_stay",
    34: "propertyTypeMap.holiday_park",
    35: "propertyTypeMap.houseboat",
    36: "propertyTypeMap.igloo",
    37: "propertyTypeMap.island",
    38: "propertyTypeMap.kezhan",
    39: "propertyTypeMap.lighthouse",
    40: "propertyTypeMap.plane",
    41: "propertyTypeMap.ranch",
    42: "propertyTypeMap.religious_building",
    43: "propertyTypeMap.riad",
    44: "propertyTypeMap.rv",
    45: "propertyTypeMap.shipping_container",
    46: "propertyTypeMap.tent",
    47: "propertyTypeMap.tiny_house",
    48: "propertyTypeMap.tipi",
    49: "propertyTypeMap.tower",
    50: "propertyTypeMap.train",
    51: "propertyTypeMap.treehouse",
    52: "propertyTypeMap.windmill",
    53: "propertyTypeMap.yurt"
};

export const listingTypeMap: Record<number, string> = {
    1: "listingTypeMap.entire",
    2: "listingTypeMap.private",
    3: "listingTypeMap.shared",
}

interface FeeInfo {
    name: string;
    type: string;
  }
  
  interface FeeChargeType {
    name: string;
  }
  
  export interface ReservationFee {
    id: number;
    fee_id: number;
    description: string | null;
    condition_type: string;
    quantity: number;
    amount_net: number;
    amount_tax: number;
    amount_gross: number;
    amount_net_total: number;
    amount_tax_total: number;
    amount_gross_total: number;
    amount_incl_total: number;
    valid_from: string | null;
    valid_to: string | null;
    start_date: string;
    end_date: string;
    cap_type: string | null;
    cap_length: number | null;
    inclusive_tax: number;
    exclusive_tax: number;
    created_at: string;
    updated_at: string;
    fee: FeeInfo;
    feeChargeType: FeeChargeType;
  }