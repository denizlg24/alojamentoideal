
export interface BokunProductResponse {
    baseLanguage: string;
    box: boolean;
    boxedProductId: number;
    boxedSupplierId: number;
    customFields: {
        type: string;
        flags: string[];
        code: string;
        title: string;
        inputFieldId: number;
        value: string;
    }[];
    excerpt: string;
    externalId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: Record<string, any>; // open object with dynamic keys
    flags: string[];
    id: string;
    keyPhoto: {
        id: number;
        originalUrl: string;
        description: string;
        alternateText: string;
        height: number;
        width: number;
        flags: string[];
        derived: {
            name: string;
            url: string;
            cleanUrl: string;
        }[];
        fileName: string;
    };
    keywords: string[];
    languages: string[];
    location: {
        address: string;
        city: string;
        countryCode: string;
        postCode: string;
        latitude: number;
        longitude: number;
        zoomLevel: number;
        origin: string; // e.g. "GOOGLE_PLACES"
        originId: string;
        wholeAddress: string;
    };
    locationCode: {
        coordinates: string;
        country: string;
        date: number;
        function: string;
        iata: string;
        id: number;
        location: string;
        name: string;
        nameWoDiacritics: string;
        recentChange: string;
        remarks: string;
        status: string;
        subdivision: string;
    };
    paymentCurrencies: string[];
    photos: {
        id: number;
        originalUrl: string;
        description: string;
        alternateText: string;
        height: number;
        width: number;
        flags: string[];
        derived: {
            name: string;
            url: string;
            cleanUrl: string;
        }[];
        fileName: string;
    }[];
    places: {
        id: number;
        location: {
            address: string;
            city: string;
            countryCode: string;
            postCode: string;
            latitude: number;
            longitude: number;
            zoomLevel: number;
            origin: string;
            originId: string;
            wholeAddress: string;
        };
        title: string;
    }[];
    price: number;
    productGroupId: number;
    slug: string;
    summary: string;
    title: string;
    vendor: {
        externalId: string;
        flags: string[];
        id: number;
        title: string;
    };
    videos: {
        id: number;
        title: string;
        sourceUrl: string;
        thumbnailUrl: string;
        previewUrl: string;
        html: string;
        providerName: string;
        cleanPreviewUrl: string;
        cleanThumbnailUrl: string;
    }[];
}
export interface ActivityPreviewResponse {
    id: number;
    title: string;
    shortDescription: string;
    minAge: number;
    photos: {
        id: number;
        originalUrl: string;
        url: string;
        caption: string;
    }[];
    duration: { minutes: number, hours: number, days: number, weeks: number };
    location: {
        id: number,
        countryCode: string,
        city: string,
        state: string,
        latitude: number,
        longitude: number
    };
    pricingCategories: { defaultId: number, ids: number[] }
    pricing: {
        experiencePriceRules: {
            id: number;
            rate: {
                id: number;
                externalId: string;
            };
            created: number; // timestamp in ms
            priceCatalogId: number;
            currency: string;
            amount: string; // values come as strings, not numbers
            pricingCategoryId: number;
            tierId: number;
        }[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        extraPriceRules: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pickupPriceRules: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dropoffPriceRules: any[];
        priceCatalogCurrencies: {
            priceCatalogId: number;
            currencies: string[];
            defaultCurrency: string;
        }[];
    };
    difficultyLevel: ExperienceDifficultyLevelDto;
}

export type ExperienceTypeDto = 'DAY_TOUR_OR_ACTIVITY' | 'ATTRACTION' | 'EVENT' | 'TRANSPORT' | 'MULTI_DAY_TOUR'
export type ExperienceCategoryDto = 'WALKING_TOUR' | 'BUS_OR_MINIVAN_TOUR' | 'AIR_OR_HELICOPTER_TOUR' | 'SAILING_OR_BOAT_TOUR' | 'PRIVATE_CAR_TOUR' | 'SEAT_IN_COACH_TOUR' | 'SEGWAY_TOUR' | 'SNOWMOBILE_TOUR' | 'ATV_OR_QUAD_TOUR' | 'BIKE_TOUR' | 'HOP_ON_HOP_OFF_TOUR' | 'TOURIST_PASS' | 'RAIL_PASS' | 'AMUSEMENT_PARK' | 'AIRPORT_LOUNGE' | 'SHOWS_AND_MUSICALS' | 'SPECTATOR_SPORTS' | 'FESTIVAL' | 'MUSEUMS_AND_EXHIBITIONS' | 'SIGHTSEEING_ATTRACTION' | 'ZOOS_AND_AQUARIUMS' | 'SIGHTSEEING' | 'ARTS_AND_CULTURE' | 'CLASSES_AND_WORKSHOPS' | 'CULINARY' | 'NIGHTLIFE' | 'SHOPPING' | 'PHOTOGRAPHY' | 'TV_AND_MOVIES' | 'ESCAPE_GAME' | 'SPA_AND_WELLNESS' | 'ADVENTURE' | 'WATER' | 'NATURE' | 'SAFARI_AND_WILDLIFE' | 'BIRDWATCHING' | 'DOLPHIN_OR_WHALEWATCHING' | 'SURFING' | 'CANOEING' | 'CAVING' | 'CLIMBING' | 'DIVING' | 'GLACIER_HIKING' | 'HIKING' | 'HORSEBACK_RIDING' | 'ICE_CLIMBING' | 'KAYAKING' | 'RAFTING' | 'SEA_ANGLING' | 'HUNTING' | 'FISHING' | 'SKIING' | 'SNORKELING' | 'SELF_DRIVE_TOUR' | 'PRIVATE_ROUNDRIP' | 'MINI_CRUISE' | 'CITY_BREAK' | 'SHORT_BREAK' | 'SUN_AND_BEACH' | 'PILGRIMAGE_OR_RELIGION' | 'MOTORCYCLE_TOURS' | 'MOUNTAIN_BIKE' | 'GOLF' | 'MULTISPORT' | 'EDUCATIONAL_TOUR' | 'LANGUAGE_TOUR' | 'MEDICAL_TOUR' | 'CULTURAL_AND_THEME_TOURS' | 'DAY_TRIPS_AND_EXCURSIONS' | 'HOLIDAY_AND_SEASONAL_TOURS' | 'LUXURY_AND_SPECIAL_OCCASIONS' | 'OBSTACLE_COURSES' | 'ADRENALINE_AND_EXTREME' | 'PAINTBALL' | 'PARAGLIDING' | 'RUNNING' | 'SHORE_EXCURSIONS' | 'THEME_PARKS' | 'TROLLEY_TOURS' | 'LAYOVER_TOURS' | 'CLASSIC_CAR_TOURS' | 'UNDERGROUND_TOURS' | 'PLANTATION_TOURS' | 'HORSE_CARRIAGE_RIDE' | 'SKIP_THE_LINE' | 'CITY_TOURS' | 'TRANSFERS_AND_GROUND_TRANSPORT' | 'VIP_AND_EXCLUSIVE' | 'WEDDING_AND_HONEYMOON' | 'EBIKE_TOUR' | 'BUS_TOUR' | 'MINIVAN_TOUR' | 'JET_SKI_TOUR'
export type ExperienceThemeDto = 'FAMILY_FRIENDLY' | 'ECO_FRIENDLY' | 'ROMANTIC' | 'LUXURY' | 'RAINY_DAY' | 'SKIP_THE_LINE' | 'GROUP_FRIENDLY' | 'INDOOR' | 'OUTDOOR' | 'PRIVATE_ACTIVITY' | 'TAILOR_MADE' | 'BEACH' | 'ADULTS_ONLY' | 'COUPLES' | 'SENIOR' | 'YOUTH' | 'VOLUNTEERS'
export type ExperienceDifficultyLevelDto = 'VERY_EASY' | 'EASY' | 'MODERATE' | 'CHALLENGING' | 'DEMANDING' | 'EXTREME'
export interface DurationDto {
    hours: number, minutes: number, days: number, weeks: number
}
export interface GooglePlaceDto {
    id: number;
    countryCode: string;
    city: string;
    state: string;
    name: string;
    placeId: number;
    latitude: number;
    longitude: number;
    lookupLang: string;
}
export interface AddressDto {
    id: number;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    googlePlaceId: string;

}
export interface ExperienceItineraryDto {
    id: number;
    title: string;
    excerpt: string;
    description: string;
    address: AddressDto;
    photos: number[]
}
export interface PhotoDto {
    id: number;
    originalUrl: string;
    url: string;
    caption: string;
    alternateText: string;
    height: number;
    width: number;
}

export type ExperienceGuidanceTypeDto = 'GUIDED' | 'HEADPHONES' | 'READING_MATERIAL'

export type ExperienceGuidedLanguagesDto = {
    [keyType in ExperienceGuidanceTypeDto]: string;
};

export type ExperienceInclusionExclusionTypeDto = 'ENTRY_OR_ADMISSION_FEE' | 'FUEL_SURCHARGE' | 'LANDING_AND_FACILITY_FEES' | 'PARKING_FEES' | 'ENTRY_TAX' | 'DEPARTURE_TAX' | 'NATIONAL_PARK_ENTRANCE_FEE' | 'GOODS_AND_SERVICES_TAX' | 'TIP_OR_GRATUITY' | 'FOOD_AND_DRINKS' | 'WIFI' | 'BUS_FARE';

export type ExperienceKnowBeforeYouGoTypeDto = 'STROLLER_OR_PRAM_ACCESSIBLE' | 'WHEELCHAIR_ACCESSIBLE' | 'LIMITED_MOBILITY_ACCESSIBLE' | 'LIMITED_SIGHT_ACCESSIBLE' | 'ANIMALS_OR_PETS_ALLOWED' | 'PUBLIC_TRANSPORTATION_NEARBY' | 'INFANT_SEATS_AVAILABLE' | 'INFANTS_MUST_SIT_ON_LAPS' | 'PASSPORT_REQUIRED' | 'DRESS_CODE'

export type ExtraTypeDto = 'FOOD' | 'DRINKS' | 'SAFETY' | 'TRANSPORT' | 'DONATION' | 'OTHERS'

export interface ExtraDto {
    id: number;
    externalId: string;
    title: string;
    description: string;
    maxPerBooking: number;
    type: ExtraTypeDto;
    limitByPax: boolean;
    commissionGroupId: number;
}

export type ExperienceBookingTypeDto = 'PASS' | 'DATE' | 'DATE_AND_TIME';

export interface LocalTimeDto {
    hours: number;
    minute: number;
    second: number;
}

export interface OpeningHoursTimeIntervalDto {
    id: number;
    openFrom: LocalTimeDto;
    openForHours: number;
    openForMinutes: number;
}

export interface OpeningHoursWeekdayDto {
    open24Hours: boolean;
    timeIntervals: OpeningHoursTimeIntervalDto[]
}

export interface OpeningHoursDto {
    id: number;
    monday: OpeningHoursWeekdayDto,
    tuesday: OpeningHoursWeekdayDto,
    wednesday: OpeningHoursWeekdayDto,
    thursday: OpeningHoursWeekdayDto,
    friday: OpeningHoursWeekdayDto,
    saturday: OpeningHoursWeekdayDto,
    sunday: OpeningHoursWeekdayDto,
}

export interface SeasonalOpeningHoursDtp {
    id: number;
    monday: OpeningHoursWeekdayDto,
    tuesday: OpeningHoursWeekdayDto,
    wednesday: OpeningHoursWeekdayDto,
    thursday: OpeningHoursWeekdayDto,
    friday: OpeningHoursWeekdayDto,
    saturday: OpeningHoursWeekdayDto,
    sunday: OpeningHoursWeekdayDto,
    startYear: number;
    startMonth: number;
    startDay: number;
    endYear: number;
    endMonth: number;
    endDay: number;
}

export type ExperienceCutoffTypeDto = 'RELATIVE_TO_START_TIME' | 'RELATIVE_TO_WORKING_HOURS_OPEN' | 'RELATIVE_TO_WORKING_HOURS_CLOSE' | 'RELATIVE_TO_ONE_SET_TIME'


export interface ExperienceCutoffDto {
    type: ExperienceCutoffTypeDto;
    referenceHour: number;
    referenceMinute: number;
    minutes: number;
    hours: number;
    days: number;
    weeks: number;
}

export interface ExperienceComboRateMappingDto {
    comboParentRate: { id: number, externalId: string }
    comboChildRateId: number;
}

export interface ExperienceComboPricingCategoryMappingDto {
    comboParentPricingCategoryId: number;
    comboChildPricingCategoryId: number;
}

export interface ExperienceComboStartTimeMappingDto {
    id: number;
    comboChildStartTimeId: number;
    inheritPickupFromParent: boolean;
    pickupPlace: string;
    dropoffPlace: string;
    rateMappings: ExperienceComboRateMappingDto[];
    pricingCategoryMappings: ExperienceComboPricingCategoryMappingDto[]
}

export interface ExperienceStartTimeDto {
    id: number;
    externalId: string;
    label: string;
    externalLabel: string;
    hour: number;
    minute: number;
    overrideWhenPickup: boolean;
    pickupHour: number;
    pickupMinute: number;
    voucherPickupMsg: string;
    durationMinutes: number;
    durationHours: number;
    durationDays: number;
    durationWeeks: number;
    comboStartTimeMappings: ExperienceComboStartTimeMappingDto[]
}
export type DayOfWeekDto = 'MONDAY' | 'TUESDAY' | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | 'SATURDAY' | 'SUNDAY';
export type MonthDto = 'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER';
export interface RecurrenceRuleDto {
    startDate: string;
    endDate: string;
    byWeekday: DayOfWeekDto[];
    byMonth: MonthDto[];

}

export interface ExperienceRecurrenceRuleDto {
    id: number;
    recurrenceRule: RecurrenceRuleDto;
    maxCapacity: number;
    maxCapacityForPickup: number;
    minTotalPax: number;
    allStartTimes: boolean;
    startTimeIds: { id: number, externalId: string }[];
    guidedLanguages: string[];
}

export interface ExperiencePricingCategoryReplacementDto {
    removedId: number;
    replacementId: number;
}

export interface ExperiencePricingCategoriesDto {
    defaultId: string;
    ids: number[];
    replacements: ExperiencePricingCategoryReplacementDto[];
}

export interface ExperiencePassSettingsDto {
    expiryType: 'NEVER' | 'FIXED_DATE' | 'RELATIVE_DATE';
    capacity: number;
    expiryDate: string;
    validFromDays: number;
}

export interface ExperienceRateTierDto {
    id: number;
    minPassengersRequired: number;
    maxPassengersRequired: number;
    pricingCategoryId: number;
}

export interface ExperienceRateExtraConfigDto {
    id: number;
    extra: { id: number, externalId: string };
    selectionType: 'OPTIONAL' | 'PRESELECTED';
    pricingType: 'INCLUDED_IN_PRICE' | 'PRICED_SEPARATELY';
    pricedPerPerson: boolean;
}

export interface ExperienceRateDto {
    id: number;
    externalId: string;
    title: string;
    description: string;
    created: number;
    lastModified: string;
    minPerBooking: number;
    maxPerBooking: number;
    pickupSelectionType: 'OPTIONAL' | 'PRESELECTED' | 'UNAVAILABLE',
    pickupPricingType: 'INCLUDED_IN_PRICE' | 'PRICED_SEPARATELY',
    pickupPricedPerPerson: boolean;
    dropoffSelectionType: 'OPTIONAL' | 'PRESELECTED' | 'UNAVAILABLE'
    cancellationPolicy: { id: number; created: number[]; title: string; penaltyRules: { id: number; created: number[], cutoffHours: number; percentage: number; }[]; policyType: 'NON_REFUNDABLE' | 'FULL_REFUND' | 'SIMPLE' | 'ADVANCED' };
    pricedPerPerson: boolean;
    tieredPricingEnabled: boolean;
    tiers: ExperienceRateTierDto[]
    extraConfigs: ExperienceRateExtraConfigDto[]
    allStartTimes: boolean;
    startTimeIds: number[];
    allPricingCategories: boolean;
    pricingCategoryIds: number[]
}

export interface ExperienceRatesDto {
    defaultRate: { id: number, externalId: string };
    rates: ExperienceRateDto[]
}

export interface ExperiencePriceRuleDto {
    id: number;
    rate: {
        id: number;
        externalId: string;
    };
    created: number;
    priceCatalogId: number;
    currency: string;
    amount: string;
    pricingScheduledId: number;
    pricingCategoryId: number;
    tierId: number;
}

export type ExtraPriceRuleDto = {
    extra: { id: number, externalId: string }
} & ExperiencePriceRuleDto

export interface ExperiencePriceCatalogCurrenciesDto {
    priceCatalogId: number;
    currencies: string[];
    defaultCurrency: string;
}

export interface ExperiencePricingDto {
    experiencePriceRules: ExperiencePriceRuleDto[]
    extraPriceRules: ExtraPriceRuleDto[];
    pickupPriceRules: ExperiencePriceRuleDto[];
    dropoffPriceRules: ExperiencePriceRuleDto[];
    priceCatalogCurrencies: ExperiencePriceCatalogCurrenciesDto[];
}

export type ContactInformationTypeDto = 'TITLE' | 'FIRST_NAME' | 'LAST_NAME' | 'PERSONAL_ID_NUMBER' | 'EMAIL' | 'PHONE_NUMBER' | 'NATIONALITY' | 'GENDER' | 'ORGANIZATION' | 'PASSPORT_ID' | 'PASSPORT_EXPIRY' | 'ADDRESS' | 'DATE_OF_BIRTH' | 'LANGUAGE'

export interface ContactInformationDto {
    type: ContactInformationTypeDto;
    required: boolean;
    requiredBeforeDeparture: boolean;
}

export type ExperienceBookingQuestionDataTypeDto = 'SHORT_TEXT' | 'LONG_TEXT' | 'INT' | 'DOUBLE' | 'BOOLEAN' | 'CHECKBOX_TOGGLE' | 'DATE' | 'DATE_AND_TIME' | 'OPTIONS'
export type ExperienceBookingQuestionContextDto = 'BOOKING' | 'PASSENGER' | 'EXTRA';
export type ExperienceBookingQuestionTriggerSelectionDto = 'ANY' | 'SELECTED_ONLY'

export interface ExperienceBookingQuestionDto {
    id: number;
    created: number;
    lastModified: number;
    label: string;
    personalData: boolean;
    required: boolean;
    requiredBeforeDeparture: boolean;
    help: string;
    placeholder: string;
    dataType: ExperienceBookingQuestionDataTypeDto;
    defaultValue: string;
    context: ExperienceBookingQuestionContextDto;
    pricingCategoryTriggerSelection: ExperienceBookingQuestionTriggerSelectionDto;
    pricingCategoryTriggers: number[];
    rateTriggerSelection: ExperienceBookingQuestionTriggerSelectionDto;
    rateTriggers: { id: number, externalId: string }[];
    extraTriggerSelection: ExperienceBookingQuestionTriggerSelectionDto;
    extraTriggers: { id: number, externalId: string }[];
    options: { id: number, label: string, value: string }[];
}

export interface ExperienceComboSettingsDto {
    isCombo: boolean;
    ticketPerComboComponent: boolean;
    ticketComboComponents: number[];
}

export interface ExperienceInventoryRateMappingDto {
    platformRate: { id: number, externalId: string };
    remoteRateId: string;
}

export interface ExperienceInventoryPricingCategoryMappingDto {
    platformPricingCategoryId: number;
    remotePricingCategoryId: string;
}

export interface ExperienceInventoryExtraMappingDto {
    platformExtra: { id: number, externalId: string };
    remoteExtraId: string;
}

export interface ExperienceInventorySettingsDto {
    enabled: boolean;
    inventoryPluginId: string;
    remoteProductId: string;
    rateMappings: ExperienceInventoryRateMappingDto[];
    pricingCategoryMappings: ExperienceInventoryPricingCategoryMappingDto[];
    extraMappings: ExperienceInventoryExtraMappingDto[];
}

export interface ExperienceBoxSettingsDto {
    isBox: boolean;
    boxedProductId: number;
    overridePhotosVideos: boolean;
    overrideCustomInputFieldValues: boolean;
    overrideItinerary: boolean;
}

export interface ExperienceMeetingSettingsDto {
    type: 'MEET_ON_LOCATION' | 'PICK_UP' | 'MEET_ON_LOCATION_OR_PICK_UP';
    meetingPointPlaceGroupId: number;
    meetingPointAddresses: { id: number, title: string, address: AddressDto }[];
    allPickupPlaceGroups: boolean;
    pickupPlaceGroupIds: number[];
    pickupMinutesBefore: number;
    pickupTimeWindow: number;
    pickupTimeLocationBased: boolean;
    pickupTimeByLocation: { placeId: number; minBeforeStart: number }[];
    pickupAllotment: boolean;
    customPickupAllowed: boolean;
    showPickupMessageOnTicket: boolean;
    showNoPickupMessageOnTicket: boolean;
    noPickupMessage: string;
    dropoffService: boolean;
    customDropoffAllowed: boolean;
    dropoffPlacesSameAsPickup: boolean;
    allDropoffPlaceGroups: boolean;
    dropoffPlaceGroupIds: number[];
}

export interface FullExperienceType {
    lastModified: number;
    created: number;
    externalId: string;
    title: string;
    shortDescription: string;
    description: string;
    keywords: string[];
    type: ExperienceTypeDto;
    privateExperience: boolean;
    timeZone: string;
    categories: ExperienceCategoryDto[];
    themes: ExperienceThemeDto[];
    difficultyLevel: ExperienceDifficultyLevelDto;
    minAge: number;
    duration: DurationDto;
    onRequestDeadline: DurationDto;
    location: GooglePlaceDto;
    itinerary: ExperienceItineraryDto[];
    photos: PhotoDto[];
    guidanceTypes: ExperienceGuidedLanguagesDto;
    inclusions: ExperienceInclusionExclusionTypeDto[];
    included: string;
    exclusions: ExperienceInclusionExclusionTypeDto[];
    excluded: string;
    knowBeforeYouGo: ExperienceKnowBeforeYouGoTypeDto[];
    attention: string;
    requirements: string;
    extras: ExtraDto[];
    bookingType: ExperienceBookingTypeDto;
    defaultOpeningHours: OpeningHoursDto;
    seasonalOpeningHours: SeasonalOpeningHoursDtp[];
    cutoff: ExperienceCutoffDto;
    capacityType: 'FREE_SALE' | 'LIMITED' | 'ON_REQUEST';
    startTimes: ExperienceStartTimeDto[];
    availabilityRules: ExperienceRecurrenceRuleDto[];
    passSettings: ExperiencePassSettingsDto;
    pricingCategories: ExperiencePricingCategoriesDto;
    rates: ExperienceRatesDto;
    pricing: ExperiencePricingDto;
    mainPaxInfo: ContactInformationDto[];
    otherPaxInfo: ContactInformationDto[];
    bookingQuestions: ExperienceBookingQuestionDto[];
    returnProductId: number;
    combo: ExperienceComboSettingsDto;
    ticket: { barcodeFormat: 'QR_CODE' | 'CODE_128' | 'PDF_417' | 'DATA_MATRIX' | 'AZTEC' | 'NONE', ticketPerPerson: boolean; ticketMessage: string };
    bookingLabels: number[];
    flags: string[];
    customInputFieldValues: { customInputFieldId: number, value: string }[];
    commissionGroupId: number;
    inventorySettings: ExperienceInventorySettingsDto;
    allowCustomizedBookings: boolean;
    boxSettings: ExperienceBoxSettingsDto;
    activation: { activated: boolean; lastActivationData: number };
    meetingType: ExperienceMeetingSettingsDto;
    marketplaceVisibilityType: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    id: number;
    reservationTimeout: number;
    earlyBookingLimit: {
        limitType: 'UNLIMITED' | 'SPECIFIC_DATE_TIME' | 'RELATIVE_TO_TRAVEL_DATE_SPECIFIC_TIME' | 'MONTHS_BEFORE_TRAVEL_DATE_SPECIFIC_TIME',
        specificDateTime: { date: { year: number, month: MonthDto, dayOfMonth: number }; time: LocalTimeDto }
        daysBefore: number;
        monthsBefore: number;
        time: LocalTimeDto;
    };

}

export interface LocationDto {
    address: string;
    city: string;
    countryCode: string;
    postCode: string;
    latitude: number;
    longitude: number;
    zoomLevel: number;
    origin: 'GOOGLE_PLACES' | 'TRIPADVISOR_API' | 'FREETEXT_LOCATION';
    originId: string;
    wholeAddress: string;
}

export interface PickupPlaceDto {
    askForRoomNumber: boolean;
    externalId: string;
    flags: string[];
    id: number;
    location: LocationDto;
    title: string;
    type: 'AIRPORT' | 'PORT' | 'STATION' | 'ACCOMMODATION' | 'OTHER';

}

export interface ActivityPlacesDto {
    pickupPlaces: PickupPlaceDto[];
    dropoffPlaces: PickupPlaceDto[]
}

export interface ExperienceAvailabilityDto {
    id: string;
    activityId: number;
    activityTitle: string;
    activityOwnerId: number;
    activityOwnerTitle: string;
    startTime: string;
    startTimeId: number;
    startTimeLabel: string;
    flexible: number;
    date: number;
    localizedDate: string;
    availabilityCount: number;
    bookedParticipants: number;
    minParticipants: number;
    minParticipantsToBookNow: number;
    productGroupId: number;
    recurrenceId: number;
    pickupAllotment: boolean;
    pickupAvailabilityCount: number;
    unlimitedAvailability: boolean;
    defaultRateId: number;
    rates: ExperienceRateDto[]
    pricesByRate: {
        activityRateId: number;
        pricePerBooking: { amount: number, currency: string };
        pricePerCategoryUnit: {
            id: number;
            amount: {
                amount: number;
                currency: string;
            }
            minParticipantsRequired: number;
            maxParticipantsRequired: number;
        }[];
        pickupPrice: { amount: number; currency: string };
        pickupPricePerCategoryUnit: {
            id: number;
            amount: {
                amount: number;
                currency: string;
            }
            minParticipantsRequired: number;
            maxParticipantsRequired: number;
        }[];
        dropoffPrice: { amount: number; currency: string };
        dropoffPricePerCategoryUnit: {
            id: number;
            amount: {
                amount: number;
                currency: string;
            }
            minParticipantsRequired: number;
            maxParticipantsRequired: number;
        }[];
        extraPricePerUnit: {
            id: number;
            amount: {
                amount: number;
                currency: string;
            }
            minParticipantsRequired: number;
            maxParticipantsRequired: number;
        }[];
        extraPricePerCategoryUnit: {
            id: number;
            amount: {
                amount: number;
                currency: string;
            }
            minParticipantsRequired: number;
            maxParticipantsRequired: number;
        }[];
    }[];
    comboActivity: boolean;
    comboStartTimes: { id: number; targetActivityId: number; targetStartTimeId: number }[];
    flags: string[];
    defaultPrice: number;
    pricesByCategory: { [key: string]: number };
    pickupPrice: number;
    pickupPricesByCategory: { [key: string]: number };
    dropoffPrice: number;
    dropoffPricesByCategory: { [key: string]: number };
    extraPrices: { [key: string]: number };
    guidedLanguages: string[];
    unavailable: boolean;
    pickupSoldOut: boolean;
    soldOut: boolean;
}

export interface QuestionSpecificationDto {
    questionId: string,
    questionCode: string,
    label: string,
    help: string,
    placeholder: string,
    required: boolean,
    defaultValue: string,
    dataType: ExperienceBookingQuestionDataTypeDto,
    dataFormat: "EMAIL_ADDRESS" | "URL" | "PHONE_NUMBER" | "COUNTRY" | "LANGUAGE" | "TIME" | "DAY_OF_MONTH" | "MONTH" | "YEAR" | "PATTERN";
    flags: string[],
    selectFromOptions: boolean;
    selectMultiple: boolean;
    answerOptions: { value: string, label: string }[],
    answers: string[];
    originalQuestion: string;
}

export interface PassengerQuestionsDto {
    bookingId: number;
    pricingCategoryId: number;
    pricingCategoryTitle: number;
    passengerDetails: QuestionSpecificationDto[];
    questions: QuestionSpecificationDto[];
}

export interface ActivityBookingQuestionsDto {
    bookingId: number;
    activityId: number;
    activityTitle: string;
    questions: QuestionSpecificationDto[];
    passengers: PassengerQuestionsDto[];
    pickupQuestions: QuestionSpecificationDto[];
    dropoffQuestions: QuestionSpecificationDto[];
}

export interface CheckoutOption {
    type: "AGENT_AFFILIATE" | "AGENT_CUSTOMER" | "AGENT_RESELLER" | "CUSTOMER_FULL_PAYMENT" | "CUSTOMER_PARTIAL_PAYMENT" | "CUSTOMER_NO_PAYMENT"
    label: string;
    questions: QuestionSpecificationDto[];
    amount: number;
    currency: string;
}


export const categoriesMap: { [key: number]: { title: string, min?: number, max?: number } } = {
    //tests
    23724: { title: 'adult', min: 18, max: 80 },
    1053743: { title: 'adult', min: 18, max: 80 },
    1053745: { title: 'child', min: 6, max: 18 },
    23726: { title: 'child', min: 6, max: 18 },
    //tests
    931209: { title: 'adult', min: 6, max: 80 },
    913896: { title: 'adult', min: 11, max: 65 },
    913891: { title: 'adult', min: 12, max: 80 },
    913885: { title: 'adult', min: 12, max: 99 },
    913887: { title: 'adult', min: 12, max: 100 },
    913884: { title: 'adult', min: 12, max: 120 },
    913890: { title: 'adult', min: 14, max: 75 },
    920301: { title: 'adult', min: 16, max: 65 },
    913893: { title: 'adult', min: 16, max: 75 },
    913894: { title: 'adult', min: 16, max: 99 },
    913889: { title: 'adult', min: 18, max: 99 },
    916615: { title: 'adult', min: 12, max: 80 },
    910476: { title: 'adult', min: undefined, max: undefined },
    913895: { title: 'child', min: 4, max: 15 },
    927059: { title: 'child', min: 6, max: 11 },
    913892: { title: 'child', min: 6, max: 11 },
    910478: { title: 'child', min: undefined, max: undefined },
    910479: { title: 'infant', min: undefined, max: undefined },
    913897: { title: 'infant', min: 4, max: 10 },
    913888: { title: 'infant', min: 5, max: 11 },
    913886: { title: 'infant', min: 6, max: 11 },
    923685: { title: 'jipe', min: 4, max: 10 },
    916196: { title: 'passenger', min: 6, max: 80 },
    910480: { title: 'senior', min: undefined, max: undefined },
    910477: { title: 'youth', min: undefined, max: undefined }
}

type DataFormat =
    | "EMAIL_ADDRESS"
    | "URL"
    | "PHONE_NUMBER"
    | "COUNTRY"
    | "LANGUAGE"
    | "TIME"
    | "DAY_OF_MONTH"
    | "MONTH"
    | "YEAR"
    | "PATTERN";

export const validators: Record<DataFormat, (value: string) => boolean> = {
    EMAIL_ADDRESS: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    URL: (v) => /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(v),
    PHONE_NUMBER: (v) => /^\+?[0-9\s()-]{7,}$/.test(v),
    COUNTRY: (v) => v.trim().length > 0, // can expand with ISO codes
    LANGUAGE: (v) => v.trim().length > 0,
    TIME: (v) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
    DAY_OF_MONTH: (v) => /^(0?[1-9]|[12]\d|3[01])$/.test(v),
    MONTH: (v) => /^(0?[1-9]|1[0-2])$/.test(v),
    YEAR: (v) => /^\d{4}$/.test(v),
    PATTERN: () => true, // maybe dynamic pattern from your API
};

export function isValid(value: string, format?: DataFormat): boolean {
    if (!format) return true;
    const validator = validators[format];
    return validator ? validator(value) : true;
}