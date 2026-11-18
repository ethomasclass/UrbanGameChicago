// The Urban Game: Chicago. All map constants, building tables, and the historical script.
// No rendering code in here, so the simulation can be tested without a browser.

export const BW = 10, BH = 12;            // blocks wide, blocks tall
export const TW = BW * 5 + 1, TH = BH * 5 + 1; // tiles (4 lots + 1 street per block)
export const NB = BW * BH, NL = NB * 16;
export const START_YEAR = 1865, END_YEAR = 1900;

// Simplified street grid of the Near West Side. West to east, then north to south.
export const NS_STREETS = ['Loomis', 'Throop', 'Centre Ave', 'Aberdeen', 'Morgan', 'Halsted', 'Desplaines', 'Jefferson', 'Clinton', 'Canal', 'The Docks'];
export const EW_STREETS = ['Madison', 'Monroe', 'Adams', 'Jackson', 'Van Buren', 'Harrison', 'Polk', 'Taylor', 'DeKoven', '12th St', 'Maxwell', '14th St', '16th St'];

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const GROUPS = [
  { name: 'American-born', short: 'American', color: '#c9c2ad', names: ['Sarah', 'Thomas', 'Mary', 'Henry'] },
  { name: 'Irish', short: 'Irish', color: '#3f9b57', names: ['Bridget', 'Patrick', 'Nora', 'Michael'] },
  { name: 'German', short: 'German', color: '#e0a93a', names: ['Greta', 'Karl', 'Liesl', 'Otto'] },
  { name: 'Bohemian', short: 'Bohemian', color: '#cf5f3c', names: ['Anna', 'Vaclav', 'Marie', 'Josef'] },
  { name: 'Italian', short: 'Italian', color: '#4a7fd1', names: ['Rosa', 'Giuseppe', 'Lucia', 'Antonio'] },
  { name: 'Russian and Polish Jewish', short: 'Jewish', color: '#9a63c4', names: ['Rivka', 'Mendel', 'Chaya', 'Avram'] },
  { name: 'Greek', short: 'Greek', color: '#35b8b0', names: ['Eleni', 'Nikos', 'Maria', 'Kostas'] },
];
export const HOOD_NAMES = ['', 'Irish quarter', 'German quarter', 'Bohemian "Praha"', 'Little Italy', 'Maxwell Street', 'Greektown'];

// Building types
export const T = {
  EMPTY: 0, SHANTY: 1, COTTAGE: 2, REAR: 3, WTEN: 4, BRICK: 5, BTEN: 6, NEWTEN: 7, MANSION: 8,
  SHOP: 10, SALOON: 11, STORE: 12,
  WORKSHOP: 20, FACTORY: 21, LUMBER: 22, SWEAT: 23, RAIL: 24,
  RUBBLE: 30,
  FIRE: 40, POLICE: 41, SCHOOL: 42, CHURCH: 43, PARK: 44, BATH: 45, HOSP: 46, HULL: 47, DEPOT: 48, BARN: 49,
};

// cap = people it was built to hold. flam = how easily it burns. poll = smoke it makes.
export const B = {
  [T.EMPTY]: { name: 'Empty lot', cap: 0, jobs: 0, flam: 0, poll: 0 },
  [T.SHANTY]: { name: 'Squatter shanty', cap: 5, jobs: 0, flam: 1.3, poll: 0, kind: 'res', note: 'Nobody planned this. A family with nowhere else to go nailed it together from scrap lumber.' },
  [T.COTTAGE]: { name: 'Frame cottage', cap: 7, jobs: 0, flam: 1, poll: 0, kind: 'res', note: 'A one-story pine "workers cottage," cheap and fast to build.' },
  [T.REAR]: { name: 'Cottage with rear house', cap: 15, jobs: 0, flam: 1.1, poll: 0, kind: 'res', note: 'The landlord built a second house in the back yard to collect more rent.' },
  [T.WTEN]: { name: 'Frame tenement', cap: 28, jobs: 0, flam: 1.15, poll: 0, kind: 'res', note: 'Three floors of pine, many families, one outdoor privy.' },
  [T.BRICK]: { name: 'Brick two-flat', cap: 9, jobs: 0, flam: 0.3, poll: 0, kind: 'res', note: 'Solid, safer from fire, and too expensive for most new arrivals.' },
  [T.BTEN]: { name: 'Brick tenement', cap: 36, jobs: 0, flam: 0.35, poll: 0, kind: 'res', note: 'Four floors of small dark rooms. Many have no window at all.' },
  [T.NEWTEN]: { name: 'Reform tenement', cap: 26, jobs: 0, flam: 0.3, poll: 0, kind: 'res', note: 'Built under the new code: a window in every room and a shared court for light and air.' },
  [T.MANSION]: { name: 'Fine home', cap: 6, jobs: 2, flam: 0.5, poll: 0, kind: 'res', note: 'A factory owner or merchant lives here, well away from the smoke.' },
  [T.SHOP]: { name: 'Shop', cap: 0, jobs: 6, flam: 1, poll: 0, kind: 'com', note: 'A grocer, baker, or dry goods store with the family living upstairs.' },
  [T.SALOON]: { name: 'Saloon', cap: 0, jobs: 4, flam: 1, poll: 0, kind: 'com', note: 'The working man\'s club, bank, and hiring hall. Also where the ward boss does business.' },
  [T.STORE]: { name: 'Brick store block', cap: 0, jobs: 16, flam: 0.35, poll: 0, kind: 'com', note: 'Three floors of shops and offices.' },
  [T.WORKSHOP]: { name: 'Workshop', cap: 0, jobs: 28, flam: 1, poll: 0.6, kind: 'ind', note: 'A planing mill, wagon shop, or small foundry.' },
  [T.FACTORY]: { name: 'Factory', cap: 0, jobs: 110, flam: 0.4, poll: 1.4, kind: 'ind', note: 'Steam power, long shifts, and a smokestack that never rests.' },
  [T.LUMBER]: { name: 'Lumber yard', cap: 0, jobs: 40, flam: 1.7, poll: 0.25, kind: 'ind', note: 'Stacks of dry pine from the north woods. Good jobs. One spark away from disaster.' },
  [T.SWEAT]: { name: 'Garment sweatshop', cap: 0, jobs: 70, flam: 0.4, poll: 0.3, kind: 'ind', note: 'Rows of sewing machines. Many of the workers are children.' },
  [T.RAIL]: { name: 'Rail yard', cap: 0, jobs: 60, flam: 0.5, poll: 1, kind: 'ind', note: 'Freight from every direction. Chicago is the rail hub of the nation.' },
  [T.RUBBLE]: { name: 'Burned ruins', cap: 0, jobs: 0, flam: 0, poll: 0 },
  [T.FIRE]: { name: 'Fire station', cap: 0, jobs: 10, flam: 0.2, poll: 0, kind: 'civ', r: 9, cost: 1800, up: 160, note: 'A steam engine, horses, and a watchtower. Fires nearby spread about half as easily.' },
  [T.POLICE]: { name: 'Police station', cap: 0, jobs: 10, flam: 0.2, poll: 0, kind: 'civ', r: 9, cost: 1400, up: 130, note: 'Keeps order. Whose order is another question.' },
  [T.SCHOOL]: { name: 'Public school', cap: 0, jobs: 10, flam: 0.3, poll: 0, kind: 'civ', r: 7, cost: 1500, up: 130, note: 'Every child in a classroom is a child out of the factory.' },
  [T.CHURCH]: { name: 'Church or synagogue', cap: 0, jobs: 2, flam: 0.5, poll: 0, kind: 'civ', r: 7, cost: 500, up: 0, note: 'The heart of an immigrant neighborhood. New arrivals settle close to their own.' },
  [T.PARK]: { name: 'Small park', cap: 0, jobs: 0, flam: 0, poll: 0, kind: 'civ', r: 4, cost: 450, up: 15, note: 'Grass, trees, and air. Also a firebreak.' },
  [T.BATH]: { name: 'Public bath', cap: 0, jobs: 4, flam: 0.2, poll: 0, kind: 'civ', r: 6, cost: 900, up: 70, note: 'Most tenement families have no bathtub.' },
  [T.HOSP]: { name: 'Hospital', cap: 0, jobs: 30, flam: 0.2, poll: 0, kind: 'civ', r: 13, cost: 3000, up: 260, note: 'Care for the sick and injured, if they can be reached in time.' },
  [T.HULL]: { name: 'Hull mansion', cap: 6, jobs: 2, flam: 0.3, poll: 0, kind: 'civ', r: 8, note: 'Built in 1856 by real estate man Charles Hull, back when this was the edge of town.' },
  [T.DEPOT]: { name: 'Union Depot', cap: 0, jobs: 40, flam: 0.3, poll: 0.5, kind: 'civ', note: 'Where the newcomers step off the train.' },
  [T.BARN]: { name: "O'Leary barn", cap: 0, jobs: 0, flam: 2, poll: 0, kind: 'civ', note: 'Catherine O\'Leary keeps five cows here and sells milk to the neighbors.' },
};

export const COST = { sewer: 350, pave: 250, line: 2400, el: 6000, bulldoze: 40 };

// Newcomers per year. The fire refugees of 1872 and the slump years are built in.
const ARR = [600, 650, 750, 850, 950, 1000, 900, 2400, 800, 600, 600, 650, 650, 700, 900, 1300, 1500, 1700, 1600, 1500, 1500, 1600, 1700, 1800, 1800, 1900, 1900, 2000, 1400, 800, 800, 900, 1000, 1200, 1400, 1400];
//                 Amer  Irish  Ger   Boh   Ital  Jew   Greek
const MIX_A = [0.20, 0.40, 0.30, 0.10, 0.00, 0.00, 0.00]; // 1865 to 1872
const MIX_B = [0.15, 0.30, 0.25, 0.25, 0.03, 0.02, 0.00]; // 1873 to 1881
const MIX_C = [0.08, 0.12, 0.12, 0.20, 0.22, 0.26, 0.00]; // 1882 to 1889
const MIX_D = [0.05, 0.05, 0.05, 0.10, 0.35, 0.37, 0.03]; // 1890 to 1895
const MIX_E = [0.05, 0.03, 0.03, 0.07, 0.34, 0.36, 0.12]; // 1896 to 1900
export function arrivalsFor(year) {
  const n = ARR[Math.max(0, Math.min(ARR.length - 1, year - START_YEAR))];
  const mix = year <= 1872 ? MIX_A : year <= 1881 ? MIX_B : year <= 1889 ? MIX_C : year <= 1895 ? MIX_D : MIX_E;
  return { n, mix };
}

// How much of the ward's industry is actually running (1 = boom, lower = slump).
export function econTarget(year, month) {
  const t = year + month / 12;
  if (t >= 1873.7 && t < 1879) return 0.62;
  if (t >= 1879 && t < 1880) return 0.85;
  if (t >= 1893.4 && t < 1897.5) return 0.6;
  if (t >= 1897.5 && t < 1898.5) return 0.85;
  return 1;
}

// Teacher-led mode stops the clock at the end of each round.
export const ROUNDS = [
  { name: 'Prairie Mud', from: 1865, to: 1870,
    intro: 'The war is over and the trains are full. Lay out your ward before the people arrive. They will arrive either way.',
    ask: ['Look at where people settled first. Why there?', 'What did you spend money on first, and what did you put off?'] },
  { name: 'Fire', from: 1871, to: 1872,
    intro: 'It has barely rained since July. Almost everything in your ward is made of pine.',
    ask: ['Which parts of your ward burned, and which did not? What made the difference?', 'Who was hurt most by the fire, and who was hurt most by the new brick-only rule?'] },
  { name: 'Panic and Strike', from: 1873, to: 1879,
    intro: 'Good times do not last. Watch what happens to your people when the factories go quiet.',
    ask: ['What happened to your ward when jobs disappeared?', 'In 1877, whose side did your ward take? Who gained and who lost from that choice?'] },
  { name: 'New Neighbors', from: 1880, to: 1885,
    intro: 'Boom times return, and the newcomers now arrive from Italy, Bohemia, and the Russian Empire. Turn on the Nationalities map and watch where they settle.',
    ask: ['Open the Nationalities map. Did you plan those neighborhoods? Who did?', 'How crowded is your most crowded block? What would it be like to live there?'] },
  { name: 'Bombs, Bosses, and Hull House', from: 1886, to: 1889,
    intro: 'Workers, bosses, politicians, and reformers all have a plan for your ward.',
    ask: ['Johnny Powers was corrupt. Why did so many of his neighbors vote for him anyway?', 'What could Hull House do that the city government was not doing?'] },
  { name: 'White City, Gray City', from: 1890, to: 1893,
    intro: 'Chicago is about to show the world a perfect city on the lakefront. Compare it to yours.',
    ask: ['Take a street-level photograph of the worst block in your ward. What does it prove?', 'The World\'s Fair showed that Americans could build a clean, planned city. Why was your ward not built that way?'] },
  { name: 'Reform', from: 1894, to: 1900,
    intro: 'Last round. The century is ending. What kind of city are you handing to the next one?',
    ask: ['Who was most responsible for the conditions in your ward: landlords, factory owners, politicians, the newcomers, or you?', 'Was the growth of cities in the late 1800s a benefit to American society? Use your own ward as evidence.'] },
];

const fmt = n => Math.round(n).toLocaleString('en-US');

// The historical script. Events with choices pause for a decision (on a countdown in solo mode).
// apply(sim, choice) changes the simulation and returns a one-line result for the news ticker.
export const EVENTS = [
  { id: 'start', year: 1865, month: 0, kicker: 'January 1865',
    head: 'The War Is Ending. Chicago Is Booming.',
    body: [
      'It is 1865. Chicago is one of the fastest growing cities in the world. Railroads from every direction meet here, and lumber from the north woods is stacked for miles along the river.',
      'You are in charge of the West Side: a ward of muddy streets and prairie grass just across the river from downtown. Every season, trains will bring more people. They will need homes, jobs, and clean water, whether you are ready or not.',
      'Zone land for housing, industry, and shops. Builders will do the rest. Then decide what the city pays for.',
    ],
    apply() { } },

  { id: 'cholera', year: 1866, month: 6, kicker: 'Summer 1866',
    head: 'Cholera Returns to Chicago',
    body: [
      'Cholera spreads through drinking water fouled by human waste. Most of the West Side still uses backyard privies and shallow wells a few steps apart.',
      'Blocks with sewers and piped water will be mostly spared. Blocks without them will not.',
    ],
    apply(s) { s.startEpidemic('water', 4, 0.025, 'Cholera'); } },

  { id: 'lumber', year: 1868, month: 3, kicker: 'Spring 1868',
    head: 'The Lumber Capital of the World',
    body: [
      'More lumber passes through Chicago than through any other city on earth. Schooners unload pine along the river day and night, and the yards are hiring.',
      'Almost everything in your ward is built from that pine: the houses, the sidewalks, even the paving blocks in some streets.',
    ],
    apply(s) { s.flags.lumberBoom = 36; return 'Lumber yards are hiring. Industry land near the river fills quickly.'; } },

  { id: 'fire', year: 1871, month: 9, kicker: 'Sunday night, October 8, 1871',
    head: 'FIRE!',
    body: [
      'After a summer with almost no rain, a fire breaks out in the O\'Leary family\'s barn on DeKoven Street. The firemen are exhausted from a huge blaze in the lumber district the night before, and they are sent to the wrong address.',
      'A hard wind is blowing from the southwest. It is pushing the flames toward the river and downtown.',
    ],
    apply(s) { s.startGreatFire(); } },

  { id: 'fireAfter', kicker: 'October 10, 1871',
    head: 'The Great Fire Is Out',
    body: s => [
      'Rain finally fell early Tuesday morning. The fire burned for about a day and a half. Across Chicago roughly 300 people are dead, the whole downtown is gone, and about 100,000 people, one in three Chicagoans, have no home.',
      `In your ward the fire destroyed ${fmt(s.stats.gfBurned)} buildings and killed ${fmt(s.stats.gfDead)} people. ${fmt(s.stats.gfHomeless)} more are homeless tonight.`,
      'No one ever proved how it started. A reporter later admitted he made up the story about Mrs. O\'Leary\'s cow kicking over a lantern. (In the real fire, the wind carried the flames across the river within hours and most of the West Side was spared. Your ward\'s luck depended on what stood in the path of the wind.)',
    ],
    scriptBody: [
      'Rain finally fell early Tuesday morning. The fire burned for about a day and a half. Across Chicago roughly 300 people are dead, the whole downtown is gone, and about 100,000 people, one in three Chicagoans, have no home.',
      'Look at your own ward. Your screen shows how many buildings you lost and how many of your people died.',
      'No one ever proved how it started. A reporter later admitted he made up the story about Mrs. O\'Leary\'s cow kicking over a lantern.',
    ],
    apply() { } },

  { id: 'limits', year: 1872, month: 0, kicker: 'January 1872',
    head: 'Rebuild in Brick?',
    body: [
      'The city council wants "fire limits": inside them, no one may put up a wooden building. Brick is far safer, but it costs much more and goes up slowly.',
      'Working families march on city hall. They say a brick-only law means they will never own a home again. Meanwhile thousands of burned-out families are crossing the river into your ward tonight, looking for a roof.',
    ],
    choices: [
      { label: 'Brick only', detail: 'New buildings are far safer from fire. They go up at half the speed, so crowding gets worse.' },
      { label: 'Allow wood', detail: 'Cheap pine cottages go up fast for the refugees. Your ward stays a tinderbox.' },
    ], def: 1,
    apply(s, c) {
      if (c === 0) { s.pol.brick = true; return 'Fire limits now cover your ward: new buildings must be brick.'; }
      return 'Your ward stays outside the fire limits. Pine cottages are going up by the dozen.';
    } },

  { id: 'panic', year: 1873, month: 8, kicker: 'September 1873',
    head: 'Panic! Banks Fail Across the Nation',
    body: [
      'A great New York bank has collapsed and the panic is spreading west. Factories are cutting wages or locking their gates. The hard times will last for years.',
      'This winter thousands of jobless Chicagoans will march to demand "bread or work."',
    ],
    choices: [
      { label: 'Open soup kitchens ($2,000)', detail: 'The ward feeds the hungry and hires the jobless to grade streets.' },
      { label: 'Leave it to private charity', detail: 'Keep the money. Churches and aid societies will do what they can.' },
    ], def: 1,
    apply(s, c) {
      if (c === 0 && s.money >= 2000) { s.money -= 2000; s.flags.relief = 60; return 'Soup kitchens open on the West Side. It is not much, but it is something.'; }
      s.flags.noRelief = 60;
      return 'The ward offers no relief. Families pawn what they own and take in more boarders.';
    } },

  { id: 'strike77', year: 1877, month: 6, kicker: 'July 1877',
    head: 'The Great Railroad Strike',
    body: [
      'The railroads have cut wages again. A strike that began in West Virginia has reached Chicago. Workers from the lumber yards and factories of the West Side are walking off the job and gathering at the Halsted Street viaduct, at the south edge of your ward.',
      'Police and soldiers are on their way.',
    ],
    choices: [
      { label: 'Back the employers ($1,500)', detail: 'Pay for extra police. The factories keep running. Your workers will remember.' },
      { label: 'Back the strikers', detail: 'Press the companies to restore wages. Factory owners threaten to build elsewhere.' },
    ], def: 0,
    apply(s, c) {
      const end = ' By the end of the week as many as thirty people lie dead around the Halsted Street viaduct.';
      if (c === 0) { s.money -= Math.min(s.money, 1500); s.mood -= 9; s.flags.order = 36; return 'Police clear the streets and the strike collapses.' + end; }
      s.mood += 7; s.flags.indFreeze = 18;
      return 'The ward stands with its workers, and factory owners stop building here for a while.' + end;
    } },

  { id: 'smallpox', year: 1881, month: 10, kicker: 'November 1881',
    head: 'Smallpox in the Tenements',
    body: [
      'Smallpox spreads fastest where people are packed together, and no part of Chicago is packed tighter than the West Side.',
      'The health department wants to go door to door through every tenement with free vaccine.',
    ],
    choices: [
      { label: 'Fund vaccination ($1,200)', detail: 'Doctors visit every crowded building in the ward.' },
      { label: 'Save the money', detail: 'Hope it passes.' },
    ], def: 1,
    apply(s, c) {
      const v = c === 0 && s.money >= 1200;
      if (v) s.money -= 1200;
      s.startEpidemic('crowd', 5, v ? 0.01 : 0.03, 'Smallpox');
      return v ? 'Vaccinators are working their way through the ward.' : 'No vaccination campaign. Smallpox moves from room to crowded room.';
    } },

  { id: 'cable', year: 1882, month: 3, kicker: 'Spring 1882',
    head: 'Cable Cars and New Arrivals',
    body: [
      'Chicago\'s first cable cars are running. They are faster than any horse, and a family that can afford the fare can now live miles from the smoke and ride to work.',
      'The people stepping off the trains are changing too. More now come from Italy, from Bohemia, and from the Russian Empire, where Jewish families are fleeing mob violence.',
    ],
    apply(s) { s.pol.cable = true; return 'Streetcar lines now carry more families out of the crowded blocks.'; } },

  { id: 'haymarket', year: 1886, month: 4, kicker: 'May 4, 1886',
    head: 'Bomb at the Haymarket',
    body: [
      'Tens of thousands of Chicago workers are on strike for an eight-hour day. Yesterday police fired on strikers outside the McCormick reaper works.',
      'Tonight, at a protest meeting near Haymarket Square just north of your ward, someone threw a bomb into a line of police. Seven officers and at least four workers are dead. Police are raiding union halls and immigrant newspapers across the West Side.',
    ],
    choices: [
      { label: 'Back the crackdown', detail: 'Order first. Union leaders in your ward are arrested.' },
      { label: 'Defend the right to organize', detail: 'Support the eight-hour day. Employers will blame you.' },
    ], def: 0,
    apply(s, c) {
      if (c === 0) { s.mood -= 8; s.boodle += 5; s.flags.order = 36; return 'Union halls are shut. The eight-hour movement is broken, for now.'; }
      s.mood += 8; s.flags.indFreeze = 12;
      return 'Your ward refuses to join the panic. Workers cheer. Factory owners do not.';
    } },

  { id: 'powers', year: 1888, month: 3, kicker: 'April 1888',
    head: 'Meet Your Alderman',
    body: [
      'Johnny Powers, a saloon keeper, now speaks for your ward on the city council. He finds jobs for his voters, pays for their funerals, and hands out turkeys at Christmas.',
      'He also sells city contracts to whoever pays him the most. Reformers call him the Prince of Boodlers. He has an offer: let him "handle" the ward\'s business.',
    ],
    choices: [
      { label: 'Work with Powers', detail: 'City jobs and favors for your people. He skims your taxes every month from now on.' },
      { label: 'Refuse him', detail: 'Stay clean. He will block you in the council: everything you build costs 25% more.' },
    ], def: 0,
    apply(s, c) {
      if (c === 0) { s.pol.boss = true; s.boodle += 28; s.patronage = 350; s.mood += 5; return 'Powers puts hundreds of his neighbors on the city payroll. Your tax money starts to leak.'; }
      s.costMult = 1.25; s.boodle += 6;
      return 'Powers smiles and says you will regret it. City contracts just got more expensive.';
    } },

  { id: 'hull', year: 1889, month: 8, kicker: 'September 1889',
    head: 'Two Women Move Into the Old Hull Mansion',
    body: [
      'Jane Addams and Ellen Gates Starr have rented the old Hull house on Halsted Street. They plan to live among their immigrant neighbors and open what they call a settlement house.',
      'They talk of a kindergarten, night classes in English, a public bath, and a playground. Their neighbors are not sure what to make of them.',
    ],
    choices: [
      { label: 'Help Hull House grow ($2,500)', detail: 'It reaches twice as far across your ward.' },
      { label: 'Wish them luck', detail: 'They open anyway, on donations, and help the nearest blocks.' },
    ], def: 1,
    apply(s, c) {
      s.pol.hull = true;
      if (c === 0 && s.money >= 2500) { s.money -= 2500; s.pol.hullFund = true; }
      s.covDirty = true;
      return s.pol.hullFund ? 'Hull House opens with a kindergarten, a bath, and a playground.' : 'Hull House opens its doors on Halsted Street.';
    } },

  { id: 'typhoid', year: 1891, month: 7, kicker: 'Summer 1891',
    head: 'Typhoid',
    body: [
      'Chicago dumps its sewage into the river. The river flows into Lake Michigan. Chicago drinks from Lake Michigan.',
      'This year typhoid fever will kill nearly two thousand Chicagoans. Sewers move the filth away from your blocks, but only clean water will end this.',
    ],
    apply(s) { s.startEpidemic('water', 5, 0.028, 'Typhoid'); } },

  { id: 'fair', year: 1893, month: 4, kicker: 'May 1893',
    head: 'The White City and the Gray City',
    body: [
      'The World\'s Columbian Exposition opens on the lakefront: white palaces, electric lights, and the first Ferris wheel. Millions will come to see a perfect, planned city.',
      'It will not last. Banks are failing across the country. By winter, jobless men will be sleeping on the floors of City Hall.',
    ],
    choices: [
      { label: 'Fund relief ($3,000)', detail: 'Soup kitchens and street-cleaning jobs through the slump.' },
      { label: 'Do nothing', detail: 'The ward cannot afford it.' },
    ], def: 1,
    apply(s, c) {
      if (c === 0 && s.money >= 3000) { s.money -= 3000; s.flags.relief = 48; return 'Relief stations open as the factories close.'; }
      s.flags.noRelief = 48;
      return 'There is no relief. Men line up at dawn outside every factory gate that is still open.';
    } },

  { id: 'pullman', year: 1894, month: 6, kicker: 'July 1894',
    head: 'Federal Troops in Chicago',
    body: [
      'Workers at the Pullman rail car works south of the city are on strike. The company cut their wages but not the rent in its company town. Railroad workers across the country now refuse to handle Pullman cars.',
      'Over the governor\'s objection, President Cleveland has sent the army to Chicago. Rail cars are burning in the yards.',
    ],
    apply(s) { return s.pullmanRiot(); } },

  { id: 'garbage', year: 1895, month: 2, kicker: 'Spring 1895',
    head: 'The Garbage War',
    body: [
      'Garbage sits in the alleys of your ward for weeks, because the collection contract went to a friend of Alderman Powers. Jane Addams bid for the contract herself. Instead, the mayor has made her the ward\'s garbage inspector. She follows the wagons at six every morning.',
      'Hull House has also just published maps showing the nationality and wages of every household on the nearby blocks. Open your own Nationalities map and compare.',
    ],
    choices: [
      { label: 'Back Addams ($800 a year)', detail: 'Honest collection. Cleaner alleys, fewer deaths, and an angry alderman.' },
      { label: 'Leave it with Powers\'s man', detail: 'Costs you nothing. The alleys stay as they are.' },
    ], def: 1,
    apply(s, c) {
      if (c === 0) { s.pol.garbage = true; s.boodle = Math.max(0, s.boodle - 10); return 'The garbage wagons are running on time for the first time anyone can remember.'; }
      s.boodle += 8;
      return 'The contract stays with the boss\'s friend. So does the garbage.';
    } },

  { id: 'el', year: 1895, month: 5, kicker: 'May 1895',
    head: 'The Elevated',
    body: [
      'The Metropolitan West Side Elevated is open: electric trains running above the alleys on steel legs.',
      'Families who can pay the fare are moving out to newer neighborhoods. The blocks underneath get shadow, noise, and soot. You can now build an elevated line.',
    ],
    apply(s) { s.pol.el = true; return 'New tool unlocked: Elevated line.'; } },

  { id: 'election', year: 1898, month: 3, kicker: 'April 1898',
    head: 'Hull House Against the Boss',
    body: [
      'Hull House is running a reform candidate against Johnny Powers. Powers answers with free beer, jobs, and a reminder of every funeral he ever paid for.',
    ],
    choices: [
      { label: 'Campaign for reform ($1,500)', detail: 'If your people are doing well enough not to need the boss, you might win.' },
      { label: 'Stay out of it', detail: 'Powers keeps his seat.' },
    ], def: 1,
    apply(s, c) {
      const real = ' In the real 19th Ward, Powers won easily. His neighbors stood by the man who had stood by them.';
      if (c === 0 && s.money >= 1500) {
        s.money -= 1500;
        if (s.happy >= 55 && s.emp >= 0.85 && s.boodle < 45) {
          s.pol.reformWon = true; s.boodle = Math.max(0, s.boodle - 30); s.costMult = 1; s.patronage = 0;
          return 'Reform wins! Powers is out. Your people had jobs and services without him.' + real;
        }
        s.boodle += 5;
        return 'Powers wins anyway. Too many of your people depend on him for work and help.' + real;
      }
      return 'Powers is reelected without a fight.' + real;
    } },

  { id: 'canal', year: 1900, month: 0, kicker: 'January 1900',
    head: 'The River Runs Backward',
    body: [
      'Engineers have finished the Sanitary and Ship Canal. The Chicago River now flows away from Lake Michigan, carrying the city\'s sewage toward the Mississippi instead of into its drinking water.',
      'This is the last year of the century, and your last year in charge.',
    ],
    apply(s) { s.pol.canal = true; return 'The lake water is cleaner. Deaths from typhoid begin to fall across the city.'; } },
];
export const EVENT = Object.fromEntries(EVENTS.map(e => [e.id, e]));

// Things your residents say. Picked by the worst condition on their lot.
export const QUOTES = {
  shanty: ['We built it ourselves from boards off the lumber dock. Nobody has asked for rent yet.', 'The water comes up through the floor when it rains.', 'They say this land belongs to someone. He has not come to say so.'],
  crowd3: ['Eleven of us sleep in three rooms. The baby sleeps in a drawer.', 'I rent a bed by the shift. A night man sleeps in it while I work.', 'Four families share one privy in the yard.', 'In summer we sleep on the roof. It is the only place with air.'],
  crowd2: ['We rent the kitchen floor to two boarders. It pays for the coal.', 'The landlord built another house in our back yard. The sun is gone.', 'My sister\'s family moved in with us last month. Where else would they go?'],
  nosewer: ['The privy vault overflows into the yard every spring.', 'We carry water from a pump in the alley. It smells.', 'Three children on this street died of the fever in August.'],
  smoke: ['Mother hangs the wash white and takes it in gray.', 'You can taste the coal smoke in the bread.', 'The baby coughs all night. The doctor says it is the air.'],
  jobless: ['I stand at the factory gate every dawn. Forty men, three jobs.', 'My wife sews buttons for pennies. It is all we have coming in.', 'The foreman says come back in spring.'],
  sweat: ['My daughter is ten. She pulls basting threads twelve hours a day.', 'We finish coats in our kitchen. All of us, even the little ones.'],
  mud: ['A horse drowned in the mud on our street last April. I am not joking.', 'The wooden sidewalk floats when it rains.'],
  fear: ['One spark and this whole row goes up. Everybody knows it.', 'I keep a bucket of water by the bed.'],
  elshadow: ['The train passes my window every four minutes. We have stopped hearing it.'],
  boss: ['Mr. Powers got my boy a job with the streets department. He has my vote.', 'When my husband died, the alderman paid for the funeral. The reformers sent a pamphlet.'],
  hull: ['I am learning English at the Hull House at night. Miss Addams knows my name.', 'The children go to the kindergarten on Halsted Street. It costs nothing.'],
  school: ['My son can read the newspaper to me now.', 'Both girls are in school. In the old country they would be in the fields.'],
  park: ['On Sunday the whole street walks to the park.', 'The children have grass to run on.'],
  good: ['We have two rooms, a window, and steady work. It is more than we had at home.', 'I am saving for a cottage of our own.', 'The streetcar gets me to the mill in twenty minutes.', 'This is a hard city. It is still better than where we came from.'],
  mansion: ['Father says the West Side is not what it was. We may move to the lakefront.', 'The smoke from the yards spoils the curtains.'],
};
export const JOBS = ['laundry worker', 'lumber shover', 'teamster', 'garment worker', 'machinist', 'peddler', 'day laborer', 'cigar roller', 'hod carrier', 'factory hand', 'fruit seller', 'rag picker', 'boarder', 'packing house hand'];

export const LANDMARKS = [
  { bx: 5, by: 1, lx: 3, ly: 3, b: T.CHURCH, name: "St. Patrick's" },
  { bx: 3, by: 8, lx: 1, ly: 3, b: T.CHURCH, name: 'Holy Family' },
  { bx: 4, by: 6, lx: 3, ly: 0, b: T.HULL, name: 'Hull mansion' },
  { bx: 7, by: 7, lx: 1, ly: 3, b: T.BARN, name: "O'Leary barn" },
  { bx: 9, by: 1, lx: 2, ly: 1, b: T.DEPOT, name: 'Union Depot' },
];
