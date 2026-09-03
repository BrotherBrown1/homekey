// Frequently asked questions, written from the questions people actually
// type into Google and ask AI assistants about home buyer grants.
//
// One list feeds both the /faq page and its FAQPage structured data, so
// what search engines and AI tools quote is exactly what buyers read.
// Keep answers in plain text (paragraphs separated by a blank line) so the
// JSON-LD stays valid; the page turns them into <p> tags.

import { BRAND } from "./config";
import { STATS, CLAIMS, AVERAGE_BENEFIT } from "./stats";
import { lookupAmi, amiIncomeLimit, AMI_DATA_YEAR } from "./geo/ami";

export type FaqItem = { q: string; a: string };
export type FaqSection = { title: string; items: FaqItem[] };

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const wayne = lookupAmi("MI", "Wayne")!;
const wayne80x4 = usd(amiIncomeLimit(wayne, 80, 4));
const wayne80x1 = usd(amiIncomeLimit(wayne, 80, 1));
const wayne120x4 = usd(amiIncomeLimit(wayne, 120, 4));

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "The basics",
    items: [
      {
        q: "What is a first-time home buyer grant?",
        a: `A first-time home buyer grant is money a government agency, housing authority, nonprofit, or bank gives you to cover your down payment and closing costs. Unlike your mortgage, a true grant is not repaid. Programs exist at four levels: federal, state (in Michigan that's MSHDA), county, and city, and most buyers qualify for more than one at once.`,
      },
      {
        q: "Is it really free money? Do I have to pay it back?",
        a: `It depends on the type, and the type matters more than the headline amount. A grant is never repaid. A forgivable loan is wiped out after you live in the home for a set period, usually 5 to 10 years, and only has to be repaid if you sell or move out early. A deferred loan has no monthly payment and no interest (or very low interest) but is repaid when you sell, refinance, or pay off the mortgage. A low-interest loan is a normal loan with better terms.

${BRAND.name} labels every program with its type so you always know which of the four you're looking at. Roughly half of all down payment assistance in the country is forgivable if you stay put.`,
      },
      {
        q: "How much can I actually get?",
        a: `More than most people expect, because the programs stack. In Metro Detroit a single buyer can combine MSHDA's $10,000 down payment loan with Detroit's $25,000 grant, a $20,000 FHLBank Indianapolis grant through a participating lender, and a Mortgage Credit Certificate worth up to $2,000 a year in tax credits. The average first-time buyer who runs a ${BRAND.name} search qualifies for about ${usd(AVERAGE_BENEFIT)} in stackable assistance. The exact figure depends on your county, household size, income, and the price of the home.`,
      },
      {
        q: "Who counts as a first-time home buyer?",
        a: `Almost every program uses the federal definition: you have not owned a principal residence in the last three years. So you can qualify as a first-time buyer even if you owned a home years ago. There are also carve-outs for people who are divorced or separated, displaced homemakers who were on a title but not the primary earner, and owners of homes that don't meet building codes. Some programs (repeat buyers in "targeted areas," veterans, teachers, first responders) don't require first-time status at all.`,
      },
    ],
  },
  {
    title: "Qualifying",
    items: [
      {
        q: "What disqualifies you from first-time home buyer programs?",
        a: `The common deal-breakers are: owning a principal residence in the last three years, household income over the program's limit, buying a home you won't live in (investment properties are out), a purchase price above the program's cap, a credit score under the minimum (usually 620 to 640), and skipping the required homebuyer education class. Some programs also have asset limits, so having too much cash in the bank can disqualify you for the lowest-income programs.

Two things that do NOT disqualify you: having student loans, and never having owned a home in your family. First-generation buyers actually qualify for extra money.`,
      },
      {
        q: "What credit score do I need?",
        a: `Most programs set the floor at 620 to 640. MSHDA's Michigan programs require 640. If you pair assistance with an FHA loan you can go as low as 580 for the mortgage itself, though the assistance program may still want 620. Your score doesn't need to be perfect; it needs to clear the floor. If you're a few points short, a lender or housing counselor can usually get you there in one to three months.`,
      },
      {
        q: "What are the income limits, and what does 'area median income' mean?",
        a: `Most programs cap household income at a percentage of the Area Median Income, or AMI, which HUD publishes every year for each county. The two common cutoffs are 80% (for the most generous programs) and 120% (for broader ones). The limit also rises with household size.

For ${AMI_DATA_YEAR} in Wayne County, Michigan, 80% of AMI is about ${wayne80x1} for a single person and ${wayne80x4} for a family of four, while 120% for a family of four is about ${wayne120x4}. ${BRAND.name} does this math for your county and household automatically and shows the dollar limit next to each program, so you never have to guess.`,
      },
      {
        q: "Do I have to take a class?",
        a: `Usually yes. Nearly every government program requires a HUD-approved homebuyer education course before closing. It's typically 6 to 8 hours, can be done online, and often costs nothing or under $100. Many buyers say it was worth it on its own. Your grant specialist will point you to an approved course for your program.`,
      },
      {
        q: "Can I use a grant on any house?",
        a: `No. The home must be your primary residence, and most programs cap the purchase price. City and county programs require the home to be inside their boundaries, and many require a Housing Quality Standards inspection. Some programs only work on specific properties, such as renovated land-bank homes. ${BRAND.name} shows the price cap and location rule for each match.`,
      },
      {
        q: "Do repeat buyers or investors qualify for anything?",
        a: `Investors, no; every program requires you to live in the home. Repeat buyers, sometimes. Programs open to repeat buyers include those in federally designated targeted areas, most veteran programs, some profession-based programs for teachers and first responders, and many low-down-payment mortgages like FHA and HomeReady. Tell ${BRAND.name} you've owned before and it will filter accordingly.`,
      },
    ],
  },
  {
    title: "The money",
    items: [
      {
        q: "Can I stack programs, and can I combine them with an FHA loan?",
        a: `Yes, and stacking is where the real money is. Down payment assistance is designed to sit on top of a normal mortgage: FHA, VA, USDA, or conventional. A common Michigan stack is an FHA loan, MSHDA's $10,000 down payment loan, a city or county grant, and a Mortgage Credit Certificate. Not every pair is allowed (some lender grants require that lender's mortgage, and MSHDA's tax credit can't pair with an MSHDA mortgage), so your lender confirms the final combination.`,
      },
      {
        q: "What happens if I sell or move out early?",
        a: `For a grant, usually nothing. For a forgivable loan, you repay the unforgiven portion, which shrinks each year you stay. For a deferred loan, the balance comes due at sale or refinance. Every program spells out its retention period, typically 5 to 10 years, and ${BRAND.name} lists it in the program details.`,
      },
      {
        q: "Are home buyer grants taxable?",
        a: `Government down payment grants are generally not treated as taxable income to the buyer; they reduce what you paid for the home. A Mortgage Credit Certificate works the other direction: it cuts your federal tax bill dollar-for-dollar each year. Confirm your specific situation with a tax professional.`,
      },
      {
        q: "Do the funds run out?",
        a: `Yes, and this is the part most buyers learn too late. Grants are funded in annual rounds and are first-come, first-served. Detroit's program, MSHDA's first-generation program, and the FHLBank grants have all closed at some point after their money was spent. That's why ${BRAND.name} re-checks every program's source at least every ${STATS.maxDataAgeDays} days and why it's worth starting your application the week you match.`,
      },
      {
        q: "Do I need a special lender?",
        a: `Often. State programs like MSHDA only work through participating lenders, FHLBank grants are requested by member banks and credit unions, and some bank grants require that bank's mortgage. Your ${BRAND.name} grant specialist knows which lenders handle which programs in Metro Detroit and will make the introduction.`,
      },
    ],
  },
  {
    title: "Michigan and Metro Detroit",
    items: [
      {
        q: "What does MSHDA offer first-time buyers?",
        a: `The Michigan State Housing Development Authority runs the state's core programs: the MI Home Loan (a below-market 30-year mortgage), the MI 10K DPA (up to $10,000 at 0% interest with no monthly payment, repaid when you sell or refinance), and the Mortgage Credit Certificate (20% of your mortgage interest back as a federal tax credit, up to $2,000 a year). You need a 640 credit score, income under the county limit, and a homebuyer education certificate. All of them go through MSHDA-approved lenders.`,
      },
      {
        q: "What's available in Detroit, Wayne, Oakland, and Macomb counties?",
        a: `Detroit: up to $25,000 in grant money for residents at or below 80% of AMI, plus 0% repair loans and the Detroit Home Mortgage for appraisal gaps. Wayne County: $13,999 forgivable for the smaller communities, up to $40,000 in Taylor, and up to $50,000 on Neighborhood Stabilization homes. Oakland County: a $5,000 Treasurer's grant with a 120% AMI limit, plus the HOME Consortium's $7,000 deferred loan and Pontiac's $14,999 forgivable program. Macomb County: the HOME Consortium's $10,000 deferred loan and Warren's $7,500 program. Statewide on top of all of these: MSHDA, the FHLBank Indianapolis grants of up to $20,000 or $25,000, and Flagstar's 3% gift.`,
      },
      {
        q: "I'm a teacher, nurse, firefighter, or veteran. Is there extra money?",
        a: `Yes. HUD's Good Neighbor Next Door gives teachers, police, firefighters, and EMTs 50% off the list price of HUD homes in revitalization areas. Veterans get the VA loan (0% down, no mortgage insurance) and can still stack state and local grants on top. ${BRAND.name} asks about your profession and military status so these show up in your results.`,
      },
    ],
  },
  {
    title: `Using ${BRAND.name}`,
    items: [
      {
        q: `Is ${BRAND.name} free? Do you pull my credit or sell my information?`,
        a: `Free, always. ${BRAND.name} never charges buyers, never pulls credit, and never sells your data. The site exists so the money governments set aside for first-time buyers actually reaches them. It's run by ${BRAND.realtor.name}, a licensed real estate salesperson in ${BRAND.realtor.licenseState} with ${BRAND.realtor.brokerage}, and the only thing we ask is your contact details at the end so a grant specialist can help you apply.`,
      },
      {
        q: "How does the matching work?",
        a: `You answer a few questions: where you're buying, household size and income, target price, credit score, first-time status, military service, and profession. ${BRAND.name} checks those answers against the rules of every one of its ${CLAIMS.programs}+ programs, computes the income limit for your county and household size, and shows you the programs you appear to qualify for, sorted grants first, with the reasons you qualify and anything to confirm. It takes about three minutes.`,
      },
      {
        q: "How current is the information?",
        a: `Every program has a source page, and ${BRAND.name} re-verifies each one at least every ${STATS.maxDataAgeDays} days, flagging funding windows that open or close, income limits that change, and programs that pause or end. A match is a strong starting point, not an approval: the program administrator always makes the final decision, so confirm details with them before relying on a number.`,
      },
      {
        q: "What happens after I see my matches?",
        a: `You can apply on your own using the links on each program, or ask for help. A ${BRAND.name} grant specialist will contact you within 24 hours, confirm which programs you actually qualify for, connect you with a participating lender, and walk you through the applications. There's no cost and no obligation to buy or sell through anyone.`,
      },
    ],
  },
];

export const FAQ_ITEMS: FaqItem[] = FAQ_SECTIONS.flatMap((s) => s.items);
