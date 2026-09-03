// County recognizer.
//
// Buyers type places however they like: "Wayne", "wayne county", "Wayne Co.",
// or just a city with the county left blank. Programs are keyed by exact
// county and city names, so everything funnels through here first.
//
// This module is dependency-free so the onboarding form can use it in the
// browser (to auto-fill the county) and the matcher can use it on the server.

// Suffixes people add that program data never includes.
const COUNTY_SUFFIX = /\s+(county|co\.?|parish|borough|census\s+area|municipality)$/i;

const SPECIAL_COUNTY: Record<string, string> = {
  "miami dade": "Miami-Dade",
  "miamidade": "Miami-Dade",
  "st louis city": "St. Louis City",
  "saint louis city": "St. Louis City",
  "st louis": "St. Louis",
  "saint louis": "St. Louis",
  "st clair": "St. Clair",
  "saint clair": "St. Clair",
  "st johns": "St. Johns",
  "saint johns": "St. Johns",
  "st tammany": "St. Tammany",
  "st charles": "St. Charles",
  "st bernard": "St. Bernard",
  "dc": "District of Columbia",
  "washington dc": "District of Columbia",
  "district of columbia": "District of Columbia",
  "baltimore city": "Baltimore City",
  "richmond city": "Richmond City",
  "prince georges": "Prince George's",
  "prince george's": "Prince George's",
  "queen annes": "Queen Anne's",
};

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (part.trim() === "" || part === "-" ? part : part[0].toUpperCase() + part.slice(1)))
    .join("");
}

/** "wayne county" → "Wayne"; "St louis" → "St. Louis"; "" → undefined. */
export function normalizeCounty(input?: string | null): string | undefined {
  if (!input) return undefined;
  let s = input.trim().replace(/\s+/g, " ");
  if (!s) return undefined;
  s = s.replace(COUNTY_SUFFIX, "").trim();
  const key = s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (SPECIAL_COUNTY[key]) return SPECIAL_COUNTY[key];
  // "st louis" style without the period
  const st = key.replace(/^(st|saint) /, "st. ");
  if (SPECIAL_COUNTY[st]) return SPECIAL_COUNTY[st];
  return titleCase(st);
}

/** "  detroit " → "Detroit"; "NYC" → "New York City". */
export function normalizeCity(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = input.trim().replace(/\s+/g, " ");
  if (!s) return undefined;
  const key = s.toLowerCase().replace(/\./g, "");
  const alias: Record<string, string> = {
    nyc: "New York City",
    "new york": "New York City",
    manhattan: "New York City",
    la: "Los Angeles",
    dc: "Washington",
    "washington dc": "Washington",
    "st louis": "St. Louis",
    "saint louis": "St. Louis",
    "st paul": "St. Paul",
    "saint paul": "St. Paul",
    "st petersburg": "St. Petersburg",
    "saint petersburg": "St. Petersburg",
    "ft worth": "Fort Worth",
    "ft lauderdale": "Fort Lauderdale",
    "ft wayne": "Fort Wayne",
    "ft collins": "Fort Collins",
    "ft myers": "Fort Myers",
    "mt clemens": "Mount Clemens",
    "mt pleasant": "Mount Pleasant",
  };
  if (alias[key]) return alias[key];
  return titleCase(s);
}

// City → county for the places buyers most often type. Michigan is covered
// deeply because it's the home market; elsewhere it's the larger cities.
// Keys are "ST:city" in lowercase.
const CITY_COUNTY: Record<string, string> = {
  // ---- Michigan ----
  "MI:detroit": "Wayne", "MI:dearborn": "Wayne", "MI:dearborn heights": "Wayne", "MI:livonia": "Wayne",
  "MI:westland": "Wayne", "MI:taylor": "Wayne", "MI:canton": "Wayne", "MI:redford": "Wayne",
  "MI:southgate": "Wayne", "MI:lincoln park": "Wayne", "MI:allen park": "Wayne", "MI:wyandotte": "Wayne",
  "MI:romulus": "Wayne", "MI:inkster": "Wayne", "MI:garden city": "Wayne", "MI:hamtramck": "Wayne",
  "MI:highland park": "Wayne", "MI:grosse pointe": "Wayne", "MI:plymouth": "Wayne", "MI:northville": "Wayne",
  "MI:wayne": "Wayne", "MI:trenton": "Wayne", "MI:woodhaven": "Wayne", "MI:belleville": "Wayne",
  "MI:pontiac": "Oakland", "MI:troy": "Oakland", "MI:southfield": "Oakland", "MI:farmington hills": "Oakland",
  "MI:rochester hills": "Oakland", "MI:novi": "Oakland", "MI:royal oak": "Oakland", "MI:west bloomfield": "Oakland",
  "MI:bloomfield hills": "Oakland", "MI:auburn hills": "Oakland", "MI:oak park": "Oakland", "MI:madison heights": "Oakland",
  "MI:ferndale": "Oakland", "MI:birmingham": "Oakland", "MI:waterford": "Oakland", "MI:commerce": "Oakland",
  "MI:rochester": "Oakland", "MI:hazel park": "Oakland", "MI:clawson": "Oakland", "MI:berkley": "Oakland",
  "MI:wixom": "Oakland", "MI:milford": "Oakland", "MI:lake orion": "Oakland", "MI:oxford": "Oakland",
  "MI:clarkston": "Oakland", "MI:walled lake": "Oakland", "MI:south lyon": "Oakland", "MI:orion": "Oakland",
  "MI:warren": "Macomb", "MI:sterling heights": "Macomb", "MI:clinton township": "Macomb", "MI:clinton": "Macomb",
  "MI:mount clemens": "Macomb", "MI:roseville": "Macomb", "MI:st. clair shores": "Macomb", "MI:st clair shores": "Macomb",
  "MI:eastpointe": "Macomb", "MI:shelby township": "Macomb", "MI:shelby": "Macomb", "MI:macomb": "Macomb",
  "MI:chesterfield": "Macomb", "MI:utica": "Macomb", "MI:fraser": "Macomb", "MI:center line": "Macomb",
  "MI:harrison township": "Macomb", "MI:new baltimore": "Macomb", "MI:romeo": "Macomb", "MI:richmond": "Macomb",
  "MI:ann arbor": "Washtenaw", "MI:ypsilanti": "Washtenaw", "MI:saline": "Washtenaw", "MI:chelsea": "Washtenaw",
  "MI:grand rapids": "Kent", "MI:wyoming": "Kent", "MI:kentwood": "Kent", "MI:walker": "Kent", "MI:grandville": "Kent",
  "MI:holland": "Ottawa", "MI:grand haven": "Ottawa", "MI:jenison": "Ottawa", "MI:hudsonville": "Ottawa",
  "MI:lansing": "Ingham", "MI:east lansing": "Ingham", "MI:okemos": "Ingham", "MI:mason": "Ingham",
  "MI:flint": "Genesee", "MI:burton": "Genesee", "MI:grand blanc": "Genesee", "MI:fenton": "Genesee",
  "MI:kalamazoo": "Kalamazoo", "MI:portage": "Kalamazoo", "MI:saginaw": "Saginaw", "MI:bay city": "Bay",
  "MI:muskegon": "Muskegon", "MI:jackson": "Jackson", "MI:battle creek": "Calhoun", "MI:midland": "Midland",
  "MI:monroe": "Monroe", "MI:traverse city": "Grand Traverse", "MI:port huron": "St. Clair", "MI:howell": "Livingston",
  "MI:brighton": "Livingston", "MI:lapeer": "Lapeer", "MI:benton harbor": "Berrien", "MI:st. joseph": "Berrien",
  "MI:niles": "Berrien", "MI:mount pleasant": "Isabella", "MI:marquette": "Marquette", "MI:alpena": "Alpena",
  "MI:adrian": "Lenawee", "MI:owosso": "Shiawassee", "MI:big rapids": "Mecosta", "MI:cadillac": "Wexford",
  "MI:sault ste. marie": "Chippewa", "MI:escanaba": "Delta", "MI:petoskey": "Emmet", "MI:ludington": "Mason",

  // ---- Northeast ----
  "NY:new york city": "New York", "NY:brooklyn": "Kings", "NY:queens": "Queens", "NY:bronx": "Bronx",
  "NY:staten island": "Richmond", "NY:yonkers": "Westchester", "NY:white plains": "Westchester",
  "NY:buffalo": "Erie", "NY:rochester": "Monroe", "NY:albany": "Albany", "NY:syracuse": "Onondaga",
  "NY:hempstead": "Nassau", "NY:long beach": "Nassau", "NY:islip": "Suffolk", "NY:brookhaven": "Suffolk",
  "NJ:newark": "Essex", "NJ:jersey city": "Hudson", "NJ:hoboken": "Hudson", "NJ:paterson": "Passaic",
  "NJ:elizabeth": "Union", "NJ:edison": "Middlesex", "NJ:trenton": "Mercer", "NJ:camden": "Camden",
  "NJ:hackensack": "Bergen", "NJ:toms river": "Ocean", "NJ:cherry hill": "Camden",
  "PA:philadelphia": "Philadelphia", "PA:pittsburgh": "Allegheny", "PA:allentown": "Lehigh", "PA:erie": "Erie",
  "PA:reading": "Berks", "PA:scranton": "Lackawanna", "PA:harrisburg": "Dauphin", "PA:lancaster": "Lancaster",
  "MA:boston": "Suffolk", "MA:cambridge": "Middlesex", "MA:worcester": "Worcester", "MA:springfield": "Hampden",
  "MA:lowell": "Middlesex", "MA:quincy": "Norfolk", "MA:somerville": "Middlesex", "MA:brockton": "Plymouth",
  "MA:lynn": "Essex", "MA:new bedford": "Bristol",
  "RI:providence": "Providence", "RI:warwick": "Kent", "RI:cranston": "Providence",
  "CT:hartford": "Hartford", "CT:new haven": "New Haven", "CT:bridgeport": "Fairfield", "CT:stamford": "Fairfield",
  "CT:waterbury": "New Haven", "CT:norwalk": "Fairfield",
  "NH:manchester": "Hillsborough", "NH:nashua": "Hillsborough", "NH:concord": "Merrimack",
  "ME:portland": "Cumberland", "ME:lewiston": "Androscoggin", "ME:bangor": "Penobscot",
  "VT:burlington": "Chittenden", "VT:montpelier": "Washington",

  // ---- Mid-Atlantic / South ----
  "DC:washington": "District of Columbia",
  "MD:baltimore": "Baltimore City", "MD:silver spring": "Montgomery", "MD:rockville": "Montgomery",
  "MD:bethesda": "Montgomery", "MD:gaithersburg": "Montgomery", "MD:columbia": "Howard", "MD:annapolis": "Anne Arundel",
  "MD:frederick": "Frederick", "MD:bowie": "Prince George's", "MD:hyattsville": "Prince George's",
  "MD:towson": "Baltimore", "MD:glen burnie": "Anne Arundel",
  "DE:wilmington": "New Castle", "DE:newark": "New Castle", "DE:dover": "Kent",
  "VA:arlington": "Arlington", "VA:alexandria": "Alexandria", "VA:fairfax": "Fairfax", "VA:richmond": "Richmond City",
  "VA:virginia beach": "Virginia Beach", "VA:norfolk": "Norfolk", "VA:chesapeake": "Chesapeake",
  "VA:newport news": "Newport News", "VA:hampton": "Hampton", "VA:roanoke": "Roanoke", "VA:reston": "Fairfax",
  "VA:leesburg": "Loudoun", "VA:manassas": "Manassas", "VA:woodbridge": "Prince William",
  "WV:charleston": "Kanawha", "WV:huntington": "Cabell", "WV:morgantown": "Monongalia",
  "NC:charlotte": "Mecklenburg", "NC:raleigh": "Wake", "NC:durham": "Durham", "NC:greensboro": "Guilford",
  "NC:winston-salem": "Forsyth", "NC:fayetteville": "Cumberland", "NC:cary": "Wake", "NC:wilmington": "New Hanover",
  "NC:asheville": "Buncombe", "NC:chapel hill": "Orange", "NC:high point": "Guilford",
  "SC:columbia": "Richland", "SC:charleston": "Charleston", "SC:greenville": "Greenville", "SC:north charleston": "Charleston",
  "SC:myrtle beach": "Horry", "SC:rock hill": "York", "SC:spartanburg": "Spartanburg",
  "GA:atlanta": "Fulton", "GA:decatur": "DeKalb", "GA:marietta": "Cobb", "GA:lawrenceville": "Gwinnett",
  "GA:savannah": "Chatham", "GA:augusta": "Richmond", "GA:columbus": "Muscogee", "GA:macon": "Bibb",
  "GA:athens": "Clarke", "GA:sandy springs": "Fulton", "GA:roswell": "Fulton",
  "FL:jacksonville": "Duval", "FL:miami": "Miami-Dade", "FL:hialeah": "Miami-Dade", "FL:miami beach": "Miami-Dade",
  "FL:homestead": "Miami-Dade", "FL:fort lauderdale": "Broward", "FL:hollywood": "Broward", "FL:pembroke pines": "Broward",
  "FL:coral springs": "Broward", "FL:west palm beach": "Palm Beach", "FL:boca raton": "Palm Beach",
  "FL:orlando": "Orange", "FL:kissimmee": "Osceola", "FL:sanford": "Seminole", "FL:tampa": "Hillsborough",
  "FL:st. petersburg": "Pinellas", "FL:clearwater": "Pinellas", "FL:brandon": "Hillsborough",
  "FL:fort myers": "Lee", "FL:cape coral": "Lee", "FL:sarasota": "Sarasota", "FL:bradenton": "Manatee",
  "FL:tallahassee": "Leon", "FL:gainesville": "Alachua", "FL:pensacola": "Escambia", "FL:daytona beach": "Volusia",
  "FL:lakeland": "Polk", "FL:port st. lucie": "St. Lucie", "FL:naples": "Collier", "FL:ocala": "Marion",
  "TN:nashville": "Davidson", "TN:memphis": "Shelby", "TN:knoxville": "Knox", "TN:chattanooga": "Hamilton",
  "TN:murfreesboro": "Rutherford", "TN:franklin": "Williamson", "TN:clarksville": "Montgomery",
  "KY:louisville": "Jefferson", "KY:lexington": "Fayette", "KY:bowling green": "Warren", "KY:covington": "Kenton",
  "AL:birmingham": "Jefferson", "AL:montgomery": "Montgomery", "AL:huntsville": "Madison", "AL:mobile": "Mobile",
  "AL:tuscaloosa": "Tuscaloosa", "AL:hoover": "Jefferson",
  "MS:jackson": "Hinds", "MS:gulfport": "Harrison", "MS:biloxi": "Harrison", "MS:hattiesburg": "Forrest",
  "LA:new orleans": "Orleans", "LA:metairie": "Jefferson", "LA:baton rouge": "East Baton Rouge",
  "LA:shreveport": "Caddo", "LA:lafayette": "Lafayette", "LA:lake charles": "Calcasieu",
  "AR:little rock": "Pulaski", "AR:fayetteville": "Washington", "AR:fort smith": "Sebastian", "AR:springdale": "Washington",
  "OK:oklahoma city": "Oklahoma", "OK:tulsa": "Tulsa", "OK:norman": "Cleveland", "OK:edmond": "Oklahoma",
  "OK:broken arrow": "Tulsa",

  // ---- Texas ----
  "TX:houston": "Harris", "TX:pasadena": "Harris", "TX:katy": "Harris", "TX:sugar land": "Fort Bend",
  "TX:the woodlands": "Montgomery", "TX:pearland": "Brazoria", "TX:galveston": "Galveston", "TX:league city": "Galveston",
  "TX:dallas": "Dallas", "TX:irving": "Dallas", "TX:garland": "Dallas", "TX:mesquite": "Dallas",
  "TX:richardson": "Dallas", "TX:plano": "Collin", "TX:frisco": "Collin", "TX:mckinney": "Collin",
  "TX:allen": "Collin", "TX:denton": "Denton", "TX:lewisville": "Denton", "TX:fort worth": "Tarrant",
  "TX:arlington": "Tarrant", "TX:austin": "Travis", "TX:round rock": "Williamson", "TX:cedar park": "Williamson",
  "TX:san antonio": "Bexar", "TX:new braunfels": "Comal", "TX:el paso": "El Paso", "TX:corpus christi": "Nueces",
  "TX:lubbock": "Lubbock", "TX:laredo": "Webb", "TX:amarillo": "Potter", "TX:brownsville": "Cameron",
  "TX:mcallen": "Hidalgo", "TX:waco": "McLennan", "TX:killeen": "Bell", "TX:midland": "Midland",
  "TX:odessa": "Ector", "TX:beaumont": "Jefferson", "TX:tyler": "Smith", "TX:college station": "Brazos",

  // ---- Midwest ----
  "IL:chicago": "Cook", "IL:evanston": "Cook", "IL:cicero": "Cook", "IL:oak park": "Cook",
  "IL:schaumburg": "Cook", "IL:naperville": "DuPage", "IL:aurora": "Kane", "IL:elgin": "Kane",
  "IL:joliet": "Will", "IL:waukegan": "Lake", "IL:rockford": "Winnebago", "IL:peoria": "Peoria",
  "IL:springfield": "Sangamon", "IL:champaign": "Champaign",
  "IN:indianapolis": "Marion", "IN:carmel": "Hamilton", "IN:fishers": "Hamilton", "IN:fort wayne": "Allen",
  "IN:evansville": "Vanderburgh", "IN:south bend": "St. Joseph", "IN:bloomington": "Monroe", "IN:gary": "Lake",
  "OH:columbus": "Franklin", "OH:cleveland": "Cuyahoga", "OH:cincinnati": "Hamilton", "OH:toledo": "Lucas",
  "OH:akron": "Summit", "OH:dayton": "Montgomery", "OH:parma": "Cuyahoga", "OH:canton": "Stark",
  "OH:youngstown": "Mahoning", "OH:dublin": "Franklin",
  "WI:milwaukee": "Milwaukee", "WI:madison": "Dane", "WI:green bay": "Brown", "WI:kenosha": "Kenosha",
  "WI:racine": "Racine", "WI:waukesha": "Waukesha", "WI:appleton": "Outagamie",
  "MN:minneapolis": "Hennepin", "MN:st. paul": "Ramsey", "MN:bloomington": "Hennepin", "MN:rochester": "Olmsted",
  "MN:duluth": "St. Louis", "MN:eagan": "Dakota", "MN:plymouth": "Hennepin",
  "MO:st. louis": "St. Louis City", "MO:kansas city": "Jackson", "MO:springfield": "Greene", "MO:columbia": "Boone",
  "MO:independence": "Jackson", "MO:st. charles": "St. Charles", "MO:florissant": "St. Louis",
  "KS:wichita": "Sedgwick", "KS:overland park": "Johnson", "KS:kansas city": "Wyandotte", "KS:olathe": "Johnson",
  "KS:topeka": "Shawnee", "KS:lawrence": "Douglas",
  "NE:omaha": "Douglas", "NE:lincoln": "Lancaster", "NE:bellevue": "Sarpy",
  "IA:des moines": "Polk", "IA:cedar rapids": "Linn", "IA:davenport": "Scott", "IA:iowa city": "Johnson",
  "ND:fargo": "Cass", "ND:bismarck": "Burleigh", "SD:sioux falls": "Minnehaha", "SD:rapid city": "Pennington",

  // ---- Mountain / West ----
  "CO:denver": "Denver", "CO:aurora": "Arapahoe", "CO:lakewood": "Jefferson", "CO:thornton": "Adams",
  "CO:arvada": "Jefferson", "CO:westminster": "Adams", "CO:centennial": "Arapahoe", "CO:highlands ranch": "Douglas",
  "CO:colorado springs": "El Paso", "CO:boulder": "Boulder", "CO:fort collins": "Larimer", "CO:pueblo": "Pueblo",
  "UT:salt lake city": "Salt Lake", "UT:west valley city": "Salt Lake", "UT:sandy": "Salt Lake",
  "UT:provo": "Utah", "UT:orem": "Utah", "UT:ogden": "Weber", "UT:st. george": "Washington",
  "AZ:phoenix": "Maricopa", "AZ:mesa": "Maricopa", "AZ:chandler": "Maricopa", "AZ:scottsdale": "Maricopa",
  "AZ:glendale": "Maricopa", "AZ:gilbert": "Maricopa", "AZ:tempe": "Maricopa", "AZ:peoria": "Maricopa",
  "AZ:tucson": "Pima", "AZ:flagstaff": "Coconino", "AZ:yuma": "Yuma",
  "NV:las vegas": "Clark", "NV:henderson": "Clark", "NV:north las vegas": "Clark", "NV:reno": "Washoe",
  "NV:sparks": "Washoe", "NV:carson city": "Carson City",
  "NM:albuquerque": "Bernalillo", "NM:santa fe": "Santa Fe", "NM:las cruces": "Doña Ana", "NM:rio rancho": "Sandoval",
  "ID:boise": "Ada", "ID:meridian": "Ada", "ID:nampa": "Canyon", "ID:idaho falls": "Bonneville",
  "MT:billings": "Yellowstone", "MT:missoula": "Missoula", "MT:bozeman": "Gallatin", "MT:great falls": "Cascade",
  "WY:cheyenne": "Laramie", "WY:casper": "Natrona",
  "AK:anchorage": "Anchorage", "AK:fairbanks": "Fairbanks North Star", "AK:juneau": "Juneau",
  "HI:honolulu": "Honolulu", "HI:hilo": "Hawaii", "HI:kailua": "Honolulu",

  // ---- Pacific ----
  "WA:seattle": "King", "WA:bellevue": "King", "WA:kent": "King", "WA:renton": "King", "WA:federal way": "King",
  "WA:everett": "Snohomish", "WA:tacoma": "Pierce", "WA:spokane": "Spokane", "WA:vancouver": "Clark",
  "WA:olympia": "Thurston", "WA:bellingham": "Whatcom", "WA:yakima": "Yakima",
  "OR:portland": "Multnomah", "OR:gresham": "Multnomah", "OR:beaverton": "Washington", "OR:hillsboro": "Washington",
  "OR:salem": "Marion", "OR:eugene": "Lane", "OR:bend": "Deschutes", "OR:medford": "Jackson",
  "CA:los angeles": "Los Angeles", "CA:long beach": "Los Angeles", "CA:pasadena": "Los Angeles",
  "CA:glendale": "Los Angeles", "CA:santa monica": "Los Angeles", "CA:torrance": "Los Angeles",
  "CA:pomona": "Los Angeles", "CA:inglewood": "Los Angeles", "CA:burbank": "Los Angeles", "CA:compton": "Los Angeles",
  "CA:anaheim": "Orange", "CA:santa ana": "Orange", "CA:irvine": "Orange", "CA:huntington beach": "Orange",
  "CA:garden grove": "Orange", "CA:fullerton": "Orange", "CA:costa mesa": "Orange",
  "CA:san diego": "San Diego", "CA:chula vista": "San Diego", "CA:oceanside": "San Diego", "CA:escondido": "San Diego",
  "CA:carlsbad": "San Diego", "CA:el cajon": "San Diego",
  "CA:san francisco": "San Francisco", "CA:oakland": "Alameda", "CA:fremont": "Alameda", "CA:hayward": "Alameda",
  "CA:berkeley": "Alameda", "CA:concord": "Contra Costa", "CA:richmond": "Contra Costa", "CA:antioch": "Contra Costa",
  "CA:san jose": "Santa Clara", "CA:sunnyvale": "Santa Clara", "CA:santa clara": "Santa Clara",
  "CA:mountain view": "Santa Clara", "CA:palo alto": "Santa Clara", "CA:san mateo": "San Mateo",
  "CA:daly city": "San Mateo", "CA:redwood city": "San Mateo", "CA:san rafael": "Marin",
  "CA:sacramento": "Sacramento", "CA:elk grove": "Sacramento", "CA:roseville": "Placer", "CA:folsom": "Sacramento",
  "CA:riverside": "Riverside", "CA:moreno valley": "Riverside", "CA:corona": "Riverside", "CA:temecula": "Riverside",
  "CA:san bernardino": "San Bernardino", "CA:fontana": "San Bernardino", "CA:ontario": "San Bernardino",
  "CA:rancho cucamonga": "San Bernardino", "CA:victorville": "San Bernardino",
  "CA:fresno": "Fresno", "CA:bakersfield": "Kern", "CA:stockton": "San Joaquin", "CA:modesto": "Stanislaus",
  "CA:oxnard": "Ventura", "CA:ventura": "Ventura", "CA:thousand oaks": "Ventura", "CA:santa rosa": "Sonoma",
  "CA:salinas": "Monterey", "CA:santa barbara": "Santa Barbara", "CA:visalia": "Tulare", "CA:santa cruz": "Santa Cruz",
};

/** County for a (state, city) if we know it. City may be raw user input. */
export function countyForCity(state: string, city?: string | null): string | undefined {
  const c = normalizeCity(city);
  if (!c) return undefined;
  return CITY_COUNTY[`${state.toUpperCase()}:${c.toLowerCase()}`];
}

export type ResolvedLocation = {
  state: string;
  city?: string;
  county?: string;
  /** True when the county came from the city table rather than the buyer. */
  countyInferred: boolean;
};

/** Normalize what the buyer typed and fill in the county from the city if needed. */
export function resolveLocation(input: {
  state: string;
  city?: string | null;
  county?: string | null;
}): ResolvedLocation {
  const state = input.state.trim().toUpperCase();
  const city = normalizeCity(input.city);
  let county = normalizeCounty(input.county);
  let countyInferred = false;
  if (!county) {
    county = countyForCity(state, city);
    countyInferred = Boolean(county);
  }
  return { state, city, county, countyInferred };
}
