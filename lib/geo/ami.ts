// Area Median Income (AMI) lookup.
//
// Down-payment programs almost always cap income at a percentage of the
// HUD "Area Median Family Income" for the buyer's county (80% and 120% are
// the common cutoffs). HUD publishes the figure once a year for every metro
// area and non-metro county.
//
// The numbers below are HUD FY2025 4-person median family incomes for the
// major metro areas (keyed by the counties they cover) plus a statewide
// fallback for everywhere else. They are transcribed, not fetched live, so
// treat them as accurate to within roughly ±10%. The matcher applies a
// tolerance band around every limit for exactly that reason: it only
// hard-excludes a buyer who is clearly over, and tells everyone near the
// line to confirm with the program.
//
// To refresh: HUD Income Limits → https://www.huduser.gov/portal/datasets/il.html
// (use the "Median Family Income" column for the metro/county, 4-person).

export const AMI_DATA_YEAR = "FY2025";

// HUD household-size adjustment factors, indexed by household size (1..8).
// A 1-person household's limit is 70% of the 4-person figure, and so on.
const SIZE_FACTOR = [0.7, 0.8, 0.9, 1.0, 1.08, 1.16, 1.24, 1.32] as const;

export function householdFactor(size: number): number {
  const i = Math.min(Math.max(Math.round(size), 1), SIZE_FACTOR.length) - 1;
  return SIZE_FACTOR[i];
}

type Metro = { area: string; state: string; counties: string[]; mfi4: number };

// Principal counties of each metro area → HUD 4-person median family income.
const METROS: Metro[] = [
  // ---- Michigan (home market, full coverage of the major metros) ----
  { area: "Detroit-Warren-Livonia", state: "MI", counties: ["Wayne", "Oakland", "Macomb", "Livingston", "St. Clair", "Lapeer"], mfi4: 106100 },
  { area: "Ann Arbor", state: "MI", counties: ["Washtenaw"], mfi4: 134800 },
  { area: "Grand Rapids-Wyoming", state: "MI", counties: ["Kent", "Ottawa", "Montcalm", "Ionia"], mfi4: 104200 },
  { area: "Lansing-East Lansing", state: "MI", counties: ["Ingham", "Eaton", "Clinton"], mfi4: 97800 },
  { area: "Flint", state: "MI", counties: ["Genesee"], mfi4: 80700 },
  { area: "Kalamazoo-Portage", state: "MI", counties: ["Kalamazoo"], mfi4: 93500 },
  { area: "Saginaw", state: "MI", counties: ["Saginaw"], mfi4: 77900 },
  { area: "Muskegon", state: "MI", counties: ["Muskegon"], mfi4: 81800 },
  { area: "Monroe", state: "MI", counties: ["Monroe"], mfi4: 99400 },
  { area: "Bay City", state: "MI", counties: ["Bay"], mfi4: 82300 },
  { area: "Jackson", state: "MI", counties: ["Jackson"], mfi4: 87900 },
  { area: "Battle Creek", state: "MI", counties: ["Calhoun"], mfi4: 82600 },
  { area: "Niles-Benton Harbor", state: "MI", counties: ["Berrien"], mfi4: 85700 },
  { area: "Midland", state: "MI", counties: ["Midland"], mfi4: 103300 },
  { area: "Traverse City", state: "MI", counties: ["Grand Traverse", "Leelanau", "Benzie", "Kalkaska"], mfi4: 99100 },

  // ---- Northeast ----
  { area: "New York City", state: "NY", counties: ["New York", "Kings", "Queens", "Bronx", "Richmond", "Westchester", "Rockland", "Putnam"], mfi4: 159500 },
  { area: "Nassau-Suffolk", state: "NY", counties: ["Nassau", "Suffolk"], mfi4: 174900 },
  { area: "Buffalo-Niagara", state: "NY", counties: ["Erie", "Niagara"], mfi4: 97000 },
  { area: "Rochester", state: "NY", counties: ["Monroe", "Ontario", "Wayne", "Livingston", "Orleans"], mfi4: 102300 },
  { area: "Albany-Schenectady-Troy", state: "NY", counties: ["Albany", "Schenectady", "Rensselaer", "Saratoga"], mfi4: 114700 },
  { area: "Syracuse", state: "NY", counties: ["Onondaga", "Oswego", "Madison"], mfi4: 96600 },
  { area: "Newark", state: "NJ", counties: ["Essex", "Hudson", "Union", "Morris", "Sussex", "Hunterdon"], mfi4: 131000 },
  { area: "Bergen-Passaic", state: "NJ", counties: ["Bergen", "Passaic"], mfi4: 140700 },
  { area: "Middlesex-Somerset", state: "NJ", counties: ["Middlesex", "Somerset", "Monmouth", "Ocean"], mfi4: 143200 },
  { area: "Camden", state: "NJ", counties: ["Camden", "Burlington", "Gloucester"], mfi4: 121900 },
  { area: "Philadelphia", state: "PA", counties: ["Philadelphia", "Montgomery", "Bucks", "Delaware", "Chester"], mfi4: 119100 },
  { area: "Pittsburgh", state: "PA", counties: ["Allegheny", "Beaver", "Butler", "Washington", "Westmoreland"], mfi4: 103200 },
  { area: "Harrisburg", state: "PA", counties: ["Dauphin", "Cumberland", "Perry"], mfi4: 103500 },
  { area: "Boston-Cambridge", state: "MA", counties: ["Suffolk", "Middlesex", "Norfolk", "Plymouth", "Essex"], mfi4: 156800 },
  { area: "Worcester", state: "MA", counties: ["Worcester"], mfi4: 125400 },
  { area: "Springfield", state: "MA", counties: ["Hampden", "Hampshire"], mfi4: 101300 },
  { area: "Providence", state: "RI", counties: ["Providence", "Kent", "Bristol", "Washington", "Newport"], mfi4: 115400 },
  { area: "Hartford", state: "CT", counties: ["Hartford", "Tolland", "Middlesex"], mfi4: 125600 },
  { area: "New Haven", state: "CT", counties: ["New Haven"], mfi4: 116700 },
  { area: "Bridgeport-Stamford", state: "CT", counties: ["Fairfield"], mfi4: 152800 },
  { area: "Manchester-Nashua", state: "NH", counties: ["Hillsborough"], mfi4: 127800 },
  { area: "Portland", state: "ME", counties: ["Cumberland", "York", "Sagadahoc"], mfi4: 121900 },
  { area: "Burlington", state: "VT", counties: ["Chittenden", "Franklin", "Grand Isle"], mfi4: 126000 },

  // ---- Mid-Atlantic / South ----
  { area: "Washington-Arlington", state: "DC", counties: ["District of Columbia"], mfi4: 163300 },
  { area: "Washington-Arlington (MD)", state: "MD", counties: ["Montgomery", "Prince George's", "Frederick", "Charles", "Calvert"], mfi4: 163300 },
  { area: "Washington-Arlington (VA)", state: "VA", counties: ["Arlington", "Fairfax", "Loudoun", "Prince William", "Alexandria", "Falls Church", "Fairfax City", "Manassas"], mfi4: 163300 },
  { area: "Baltimore-Columbia-Towson", state: "MD", counties: ["Baltimore City", "Baltimore", "Anne Arundel", "Howard", "Harford", "Carroll", "Queen Anne's"], mfi4: 134800 },
  { area: "Wilmington", state: "DE", counties: ["New Castle"], mfi4: 121600 },
  { area: "Richmond", state: "VA", counties: ["Richmond City", "Henrico", "Chesterfield", "Hanover"], mfi4: 114900 },
  { area: "Virginia Beach-Norfolk", state: "VA", counties: ["Virginia Beach", "Norfolk", "Chesapeake", "Newport News", "Hampton", "Portsmouth", "Suffolk"], mfi4: 103500 },
  { area: "Charleston", state: "WV", counties: ["Kanawha"], mfi4: 82600 },
  { area: "Charlotte-Concord", state: "NC", counties: ["Mecklenburg", "Union", "Cabarrus", "Gaston", "Iredell"], mfi4: 110600 },
  { area: "Raleigh-Cary", state: "NC", counties: ["Wake", "Johnston", "Franklin"], mfi4: 127900 },
  { area: "Durham-Chapel Hill", state: "NC", counties: ["Durham", "Orange", "Chatham"], mfi4: 113500 },
  { area: "Greensboro-High Point", state: "NC", counties: ["Guilford", "Randolph", "Rockingham"], mfi4: 87700 },
  { area: "Columbia", state: "SC", counties: ["Richland", "Lexington"], mfi4: 94600 },
  { area: "Charleston-North Charleston", state: "SC", counties: ["Charleston", "Berkeley", "Dorchester"], mfi4: 108400 },
  { area: "Greenville-Anderson", state: "SC", counties: ["Greenville", "Anderson", "Pickens"], mfi4: 92900 },
  { area: "Atlanta-Sandy Springs", state: "GA", counties: ["Fulton", "DeKalb", "Cobb", "Gwinnett", "Clayton", "Cherokee", "Forsyth", "Henry", "Douglas"], mfi4: 111700 },
  { area: "Savannah", state: "GA", counties: ["Chatham", "Bryan", "Effingham"], mfi4: 96300 },
  { area: "Jacksonville", state: "FL", counties: ["Duval", "Clay", "St. Johns", "Nassau"], mfi4: 100900 },
  { area: "Orlando-Kissimmee", state: "FL", counties: ["Orange", "Osceola", "Seminole", "Lake"], mfi4: 98100 },
  { area: "Tampa-St. Petersburg", state: "FL", counties: ["Hillsborough", "Pinellas", "Pasco", "Hernando"], mfi4: 99600 },
  { area: "Miami", state: "FL", counties: ["Miami-Dade"], mfi4: 89600 },
  { area: "Fort Lauderdale", state: "FL", counties: ["Broward"], mfi4: 97200 },
  { area: "West Palm Beach", state: "FL", counties: ["Palm Beach"], mfi4: 104700 },
  { area: "Cape Coral-Fort Myers", state: "FL", counties: ["Lee"], mfi4: 94500 },
  { area: "Sarasota-Bradenton", state: "FL", counties: ["Sarasota", "Manatee"], mfi4: 103500 },
  { area: "Nashville-Davidson", state: "TN", counties: ["Davidson", "Williamson", "Rutherford", "Wilson", "Sumner"], mfi4: 113100 },
  { area: "Memphis", state: "TN", counties: ["Shelby", "Tipton", "Fayette"], mfi4: 83800 },
  { area: "Knoxville", state: "TN", counties: ["Knox", "Blount", "Anderson"], mfi4: 91900 },
  { area: "Louisville", state: "KY", counties: ["Jefferson", "Oldham", "Bullitt"], mfi4: 99300 },
  { area: "Lexington-Fayette", state: "KY", counties: ["Fayette"], mfi4: 96500 },
  { area: "Birmingham-Hoover", state: "AL", counties: ["Jefferson", "Shelby"], mfi4: 92700 },
  { area: "Huntsville", state: "AL", counties: ["Madison", "Limestone"], mfi4: 110400 },
  { area: "Jackson", state: "MS", counties: ["Hinds", "Madison", "Rankin"], mfi4: 79800 },
  { area: "New Orleans-Metairie", state: "LA", counties: ["Orleans", "Jefferson", "St. Tammany", "St. Bernard"], mfi4: 89100 },
  { area: "Baton Rouge", state: "LA", counties: ["East Baton Rouge", "Ascension", "Livingston"], mfi4: 95900 },
  { area: "Little Rock", state: "AR", counties: ["Pulaski", "Saline", "Faulkner"], mfi4: 89000 },
  { area: "Oklahoma City", state: "OK", counties: ["Oklahoma", "Cleveland", "Canadian"], mfi4: 93900 },
  { area: "Tulsa", state: "OK", counties: ["Tulsa", "Rogers", "Wagoner"], mfi4: 89700 },

  // ---- Texas ----
  { area: "Houston-The Woodlands", state: "TX", counties: ["Harris", "Fort Bend", "Montgomery", "Brazoria", "Galveston"], mfi4: 99100 },
  { area: "Dallas-Plano-Irving", state: "TX", counties: ["Dallas", "Collin", "Denton", "Rockwall", "Ellis", "Kaufman"], mfi4: 114300 },
  { area: "Fort Worth-Arlington", state: "TX", counties: ["Tarrant", "Johnson", "Parker"], mfi4: 104000 },
  { area: "Austin-Round Rock", state: "TX", counties: ["Travis", "Williamson", "Hays", "Bastrop"], mfi4: 133800 },
  { area: "San Antonio-New Braunfels", state: "TX", counties: ["Bexar", "Comal", "Guadalupe"], mfi4: 92100 },
  { area: "El Paso", state: "TX", counties: ["El Paso"], mfi4: 66700 },

  // ---- Midwest ----
  { area: "Chicago-Naperville", state: "IL", counties: ["Cook", "DuPage", "Lake", "Will", "Kane", "McHenry", "Kendall"], mfi4: 119900 },
  { area: "Indianapolis-Carmel", state: "IN", counties: ["Marion", "Hamilton", "Hendricks", "Johnson", "Hancock", "Boone"], mfi4: 102000 },
  { area: "Fort Wayne", state: "IN", counties: ["Allen", "Whitley"], mfi4: 91400 },
  { area: "Columbus", state: "OH", counties: ["Franklin", "Delaware", "Fairfield", "Licking", "Union"], mfi4: 107600 },
  { area: "Cleveland-Elyria", state: "OH", counties: ["Cuyahoga", "Lake", "Lorain", "Medina", "Geauga"], mfi4: 93500 },
  { area: "Cincinnati", state: "OH", counties: ["Hamilton", "Butler", "Warren", "Clermont"], mfi4: 106300 },
  { area: "Dayton", state: "OH", counties: ["Montgomery", "Greene", "Miami"], mfi4: 92500 },
  { area: "Toledo", state: "OH", counties: ["Lucas", "Wood", "Fulton"], mfi4: 84900 },
  { area: "Akron", state: "OH", counties: ["Summit", "Portage"], mfi4: 94100 },
  { area: "Milwaukee-Waukesha", state: "WI", counties: ["Milwaukee", "Waukesha", "Washington", "Ozaukee"], mfi4: 103200 },
  { area: "Madison", state: "WI", counties: ["Dane", "Columbia", "Green", "Iowa"], mfi4: 122700 },
  { area: "Minneapolis-St. Paul", state: "MN", counties: ["Hennepin", "Ramsey", "Dakota", "Anoka", "Washington", "Scott", "Carver"], mfi4: 132100 },
  { area: "St. Louis", state: "MO", counties: ["St. Louis City", "St. Louis", "St. Charles", "Jefferson", "Franklin"], mfi4: 102800 },
  { area: "Kansas City", state: "MO", counties: ["Jackson", "Clay", "Platte", "Cass"], mfi4: 105300 },
  { area: "Kansas City (KS)", state: "KS", counties: ["Johnson", "Wyandotte", "Leavenworth"], mfi4: 105300 },
  { area: "Wichita", state: "KS", counties: ["Sedgwick", "Butler"], mfi4: 88500 },
  { area: "Omaha-Council Bluffs", state: "NE", counties: ["Douglas", "Sarpy"], mfi4: 107900 },
  { area: "Lincoln", state: "NE", counties: ["Lancaster"], mfi4: 100800 },
  { area: "Des Moines", state: "IA", counties: ["Polk", "Dallas", "Warren"], mfi4: 106600 },
  { area: "Fargo", state: "ND", counties: ["Cass"], mfi4: 111300 },
  { area: "Sioux Falls", state: "SD", counties: ["Minnehaha", "Lincoln"], mfi4: 104800 },

  // ---- Mountain / West ----
  { area: "Denver-Aurora", state: "CO", counties: ["Denver", "Arapahoe", "Jefferson", "Adams", "Douglas", "Broomfield"], mfi4: 135900 },
  { area: "Colorado Springs", state: "CO", counties: ["El Paso"], mfi4: 104700 },
  { area: "Boulder", state: "CO", counties: ["Boulder"], mfi4: 155600 },
  { area: "Fort Collins", state: "CO", counties: ["Larimer"], mfi4: 120200 },
  { area: "Salt Lake City", state: "UT", counties: ["Salt Lake", "Tooele"], mfi4: 120900 },
  { area: "Provo-Orem", state: "UT", counties: ["Utah"], mfi4: 116000 },
  { area: "Phoenix-Mesa", state: "AZ", counties: ["Maricopa", "Pinal"], mfi4: 104700 },
  { area: "Tucson", state: "AZ", counties: ["Pima"], mfi4: 88200 },
  { area: "Las Vegas-Henderson", state: "NV", counties: ["Clark"], mfi4: 96300 },
  { area: "Reno", state: "NV", counties: ["Washoe", "Storey"], mfi4: 110900 },
  { area: "Albuquerque", state: "NM", counties: ["Bernalillo", "Sandoval", "Valencia", "Torrance"], mfi4: 83900 },
  { area: "Boise City", state: "ID", counties: ["Ada", "Canyon"], mfi4: 105900 },
  { area: "Billings", state: "MT", counties: ["Yellowstone"], mfi4: 96500 },
  { area: "Cheyenne", state: "WY", counties: ["Laramie"], mfi4: 99900 },
  { area: "Anchorage", state: "AK", counties: ["Anchorage"], mfi4: 126000 },
  { area: "Honolulu", state: "HI", counties: ["Honolulu"], mfi4: 146300 },

  // ---- Pacific ----
  { area: "Seattle-Bellevue", state: "WA", counties: ["King", "Snohomish"], mfi4: 161700 },
  { area: "Tacoma-Lakewood", state: "WA", counties: ["Pierce"], mfi4: 121000 },
  { area: "Spokane", state: "WA", counties: ["Spokane", "Stevens"], mfi4: 96100 },
  { area: "Portland-Vancouver", state: "OR", counties: ["Multnomah", "Washington", "Clackamas", "Yamhill", "Columbia"], mfi4: 125300 },
  { area: "Portland-Vancouver (WA)", state: "WA", counties: ["Clark", "Skamania"], mfi4: 125300 },
  { area: "Salem", state: "OR", counties: ["Marion", "Polk"], mfi4: 99400 },
  { area: "Eugene", state: "OR", counties: ["Lane"], mfi4: 92900 },
  { area: "Los Angeles-Long Beach", state: "CA", counties: ["Los Angeles"], mfi4: 106600 },
  { area: "Orange County", state: "CA", counties: ["Orange"], mfi4: 136600 },
  { area: "San Diego-Carlsbad", state: "CA", counties: ["San Diego"], mfi4: 130800 },
  { area: "San Francisco", state: "CA", counties: ["San Francisco", "San Mateo", "Marin"], mfi4: 186300 },
  { area: "Oakland-Fremont", state: "CA", counties: ["Alameda", "Contra Costa"], mfi4: 164100 },
  { area: "San Jose-Sunnyvale", state: "CA", counties: ["Santa Clara", "San Benito"], mfi4: 195200 },
  { area: "Sacramento-Roseville", state: "CA", counties: ["Sacramento", "Placer", "El Dorado", "Yolo"], mfi4: 122200 },
  { area: "Riverside-San Bernardino", state: "CA", counties: ["Riverside", "San Bernardino"], mfi4: 99500 },
  { area: "Fresno", state: "CA", counties: ["Fresno"], mfi4: 81900 },
  { area: "Bakersfield", state: "CA", counties: ["Kern"], mfi4: 83400 },
  { area: "Stockton", state: "CA", counties: ["San Joaquin"], mfi4: 99200 },
  { area: "Ventura-Oxnard", state: "CA", counties: ["Ventura"], mfi4: 127700 },
  { area: "Santa Rosa", state: "CA", counties: ["Sonoma"], mfi4: 127100 },
];

// Statewide fallback (HUD non-metro / state median, 4-person) for counties
// outside the metros above.
const STATE_MFI: Record<string, number> = {
  AL: 74000, AK: 105000, AZ: 88000, AR: 71000, CA: 110000, CO: 105000, CT: 120000,
  DE: 105000, DC: 163300, FL: 90000, GA: 86000, HI: 120000, ID: 85000, IL: 95000,
  IN: 85000, IA: 90000, KS: 88000, KY: 76000, LA: 76000, ME: 92000, MD: 125000,
  MA: 130000, MI: 88000, MN: 108000, MS: 70000, MO: 84000, MT: 88000, NE: 93000,
  NV: 92000, NH: 120000, NJ: 130000, NM: 76000, NY: 110000, NC: 88000, ND: 100000,
  OH: 88000, OK: 80000, OR: 100000, PA: 95000, RI: 112000, SC: 82000, SD: 92000,
  TN: 82000, TX: 92000, UT: 105000, VT: 105000, VA: 105000, WA: 115000, WV: 72000,
  WI: 95000, WY: 95000,
};

const METRO_INDEX = new Map<string, Metro>();
for (const m of METROS) {
  for (const c of m.counties) METRO_INDEX.set(`${m.state}:${c.toLowerCase()}`, m);
}

export type AmiLookup = {
  /** 4-person median family income for the area. */
  mfi4: number;
  /** Human-readable area name, e.g. "Detroit-Warren-Livonia" or "Michigan (statewide)". */
  area: string;
  /** "metro" when the county was found in the table, "state" for the fallback. */
  precision: "metro" | "state";
};

/** Look up AMI for a (state, county). County should already be normalized. */
export function lookupAmi(state: string, county?: string | null): AmiLookup | null {
  const st = state.toUpperCase();
  if (county) {
    const m = METRO_INDEX.get(`${st}:${county.toLowerCase()}`);
    if (m) return { mfi4: m.mfi4, area: m.area, precision: "metro" };
  }
  const s = STATE_MFI[st];
  if (!s) return null;
  return { mfi4: s, area: `${st} (statewide)`, precision: "state" };
}

/** Income limit for a program capped at `pct`% of AMI, adjusted for household size. */
export function amiIncomeLimit(ami: AmiLookup, pct: number, householdSize: number): number {
  return Math.round((ami.mfi4 * householdFactor(householdSize) * pct) / 100);
}
