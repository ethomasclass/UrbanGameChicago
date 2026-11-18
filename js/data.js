// The Urban Game: Chicago. Map constants, building table, and the eleven rounds.
// To change what students read or must build, edit ROUNDS below.

export const BW = 5, BH = 4;                    // blocks wide, blocks tall
export const TW = BW * 5 + 1, TH = BH * 5 + 1;  // tiles (4 lots + 1 street per block)
export const NB = BW * BH, NL = NB * 16;

// West to east, then north to south.
export const NS_STREETS = ['Halsted', 'Desplaines', 'Jefferson', 'Clinton', 'Canal', 'The Docks'];
export const EW_STREETS = ['Van Buren', 'Harrison', 'Polk', 'Taylor', 'DeKoven'];

export const GROUPS = [
  { name: 'American-born', short: 'American', color: '#c9c2ad', names: ['Sarah', 'Thomas', 'Mary', 'Henry'] },
  { name: 'Irish', short: 'Irish', color: '#3f9b57', names: ['Bridget', 'Patrick', 'Nora', 'Michael'] },
  { name: 'German', short: 'German', color: '#e0a93a', names: ['Greta', 'Karl', 'Liesl', 'Otto'] },
  { name: 'Bohemian', short: 'Bohemian', color: '#cf5f3c', names: ['Anna', 'Vaclav', 'Marie', 'Josef'] },
  { name: 'Italian', short: 'Italian', color: '#4a7fd1', names: ['Rosa', 'Giuseppe', 'Lucia', 'Antonio'] },
  { name: 'Russian and Polish Jewish', short: 'Jewish', color: '#9a63c4', names: ['Rivka', 'Mendel', 'Chaya', 'Avram'] },
  { name: 'Greek', short: 'Greek', color: '#35b8b0', names: ['Eleni', 'Nikos', 'Maria', 'Kostas'] },
];
export const HOOD_NAMES = ['', 'Irish quarter', 'German quarter', 'Bohemian quarter', 'Little Italy', 'Maxwell Street', 'Greektown'];

export const T = {
  EMPTY: 0, SHANTY: 1, COTTAGE: 2, REAR: 3, WTEN: 4, BRICK: 5, BTEN: 6, NEWTEN: 7, MANSION: 8,
  SHOP: 10, SALOON: 11, STORE: 12,
  WORKSHOP: 20, FACTORY: 21, LUMBER: 22, SWEAT: 23, RAIL: 24,
  RUBBLE: 30,
  FIRE: 40, POLICE: 41, SCHOOL: 42, CHURCH: 43, PARK: 44, BATH: 45, HOSP: 46, HULL: 47, DEPOT: 48, BARN: 49,
};

// cap = people it was built to hold. flam = how easily it burns. poll = smoke it makes. r = how far its help reaches.
export const B = {
  [T.EMPTY]: { name: 'Empty lot', cap: 0, jobs: 0, flam: 0, poll: 0 },
  [T.SHANTY]: { icon: '⛺', name: 'Squatter shanty', cap: 5, jobs: 0, flam: 1.3, poll: 0, note: 'Nobody planned this. A family with nowhere else to go nailed it together from scrap lumber.' },
  [T.COTTAGE]: { icon: '🏠', name: 'Frame cottage', cap: 6, jobs: 0, flam: 1, poll: 0, note: 'A one-story pine cottage, cheap and quick to build.', tip: 'People need work within walking distance. They also need to breathe.' },
  [T.REAR]: { icon: '🏚️', name: 'Cottage with rear house', cap: 14, jobs: 0, flam: 1.1, poll: 0, note: 'The landlord built a second house in the back yard to collect more rent.' },
  [T.WTEN]: { icon: '🏢', name: 'Frame tenement', cap: 30, jobs: 0, flam: 1.15, poll: 0, note: 'Three floors of pine, many families, one outdoor privy.', tip: 'Goes on an empty lot, or click a cottage to replace it.' },
  [T.BRICK]: { icon: '🧱', name: 'Brick home', cap: 8, jobs: 0, flam: 0.3, poll: 0, note: 'Solid and safer from fire, but too costly for most newcomers.', tip: 'Brick can go on burned lots.' },
  [T.BTEN]: { icon: '🏬', name: 'Brick tenement', cap: 40, jobs: 0, flam: 0.35, poll: 0, note: 'Four floors of small dark rooms. Many have no window at all.', tip: 'Goes on an empty lot, or click an older home to replace it.' },
  [T.NEWTEN]: { icon: '🏘️', name: 'Reform tenement', cap: 28, jobs: 0, flam: 0.3, poll: 0, note: 'Built to the reformers\' rules: a window in every room and a court for light and air.', tip: 'Healthier than any other tenement. Goes on an empty lot or replaces an older home.' },
  [T.SHOP]: { icon: '🏪', name: 'Shop', cap: 0, jobs: 5, flam: 1, poll: 0, r: 4, note: 'A grocer, baker, or dry goods store with the family living upstairs.', tip: 'People like a shop close to home.' },
  [T.SALOON]: { icon: '🍺', name: 'Saloon', cap: 0, jobs: 3, flam: 1, poll: 0, r: 3, note: 'The working man\'s club, bank, and hiring hall. Also where the ward boss does business.', tip: 'The neighborhood gathering place.' },
  [T.WORKSHOP]: { icon: '🔨', name: 'Workshop', cap: 0, jobs: 25, flam: 1, poll: 0.6, note: 'A planing mill, wagon shop, or small foundry.', tip: 'Jobs, and some smoke. The wind blows toward the northeast.' },
  [T.FACTORY]: { icon: '🏭', name: 'Factory', cap: 0, jobs: 90, flam: 0.4, poll: 1.5, note: 'Steam power, long shifts, and a smokestack that never rests.', tip: 'Many jobs and heavy smoke. The wind blows toward the northeast.' },
  [T.LUMBER]: { icon: '🪵', name: 'Lumber yard', cap: 0, jobs: 30, flam: 1.7, poll: 0.25, note: 'Stacks of dry pine from the north woods. Good jobs. One spark away from disaster.', tip: 'Lumber comes by boat and rail. It also burns.' },
  [T.SWEAT]: { icon: '🧵', name: 'Garment sweatshop', cap: 0, jobs: 60, flam: 0.4, poll: 0.3, note: 'Rows of sewing machines. Many of the workers are children.', tip: 'Jobs for newcomers, at a price.' },
  [T.RUBBLE]: { name: 'Burned ruins', cap: 0, jobs: 0, flam: 0, poll: 0, note: 'Ashes, and a chimney.' },
  [T.FIRE]: { icon: '🚒', name: 'Fire station', cap: 0, jobs: 8, flam: 0.2, poll: 0, r: 6, note: 'A steam engine, horses, and a watchtower.', tip: 'Fires spread about half as easily near a station.' },
  [T.POLICE]: { icon: '👮', name: 'Police station', cap: 0, jobs: 8, flam: 0.2, poll: 0, r: 6, note: 'Keeps order. Whose order is another question.', tip: 'What, or who, should it be close to?' },
  [T.SCHOOL]: { icon: '🏫', name: 'Public school', cap: 0, jobs: 8, flam: 0.3, poll: 0, r: 5, note: 'Every child in a classroom is a child out of the factory.', tip: 'Helps the families who live close enough to walk.' },
  [T.CHURCH]: { icon: '⛪', name: 'Church or synagogue', cap: 0, jobs: 2, flam: 0.5, poll: 0, r: 5, note: 'The heart of an immigrant neighborhood.', tip: 'Newcomers settle close to their own.' },
  [T.PARK]: { icon: '🌳', name: 'Small park', cap: 0, jobs: 0, flam: 0, poll: 0, r: 3, note: 'Grass, trees, and air.', tip: 'Good for the homes right around it.' },
  [T.BATH]: { icon: '🛁', name: 'Public bath', cap: 0, jobs: 4, flam: 0.2, poll: 0, r: 4, note: 'Most tenement families have no bathtub.', tip: 'Helps the health of homes nearby.' },
  [T.HOSP]: { icon: '🏥', name: 'Hospital', cap: 0, jobs: 25, flam: 0.2, poll: 0, r: 8, note: 'Care for the sick and injured.', tip: 'Helps the health of a wide area.' },
  [T.HULL]: { icon: '🏛️', name: 'Hull House', cap: 0, jobs: 6, flam: 0.3, poll: 0, r: 7, note: 'A settlement house: kindergarten, night classes, clubs, and a door that is always open.', tip: 'Jane Addams chose to live among the poorest families. Where are yours?' },
  [T.DEPOT]: { icon: '🚂', name: 'Rail depot', cap: 0, jobs: 30, flam: 0.3, poll: 0.8, note: 'Where the newcomers step off the train.', tip: 'Trains bring people, freight, noise, and soot.' },
  [T.BARN]: { name: "O'Leary barn", cap: 0, jobs: 0, flam: 2, poll: 0, note: 'Catherine O\'Leary keeps five cows here and sells milk to her neighbors.' },
};
// Things on the build list that are not single buildings.
export const SPECIAL = {
  rear: { icon: '🏚️', name: 'Rear house', tip: 'Click one of your frame cottages. The landlord squeezes a second house into its back yard.' },
  sewer: { icon: '🚰', name: 'Block of sewers', tip: 'Click a block. Sewers and piped water protect everyone living on it.' },
  line: { icon: '🚋', name: 'Streetcar line', tip: 'Click a street. People who live near the line can ride to work anywhere.' },
  el: { icon: '🚆', name: 'Elevated line', tip: 'Click a street. Fast trains overhead, shadow and noise underneath.' },
};
export const itemOf = k => SPECIAL[k] || B[k];

//                Amer  Irish  Ger   Boh   Ital  Jew   Greek
const EARLY = [0.55, 0.25, 0.20, 0, 0, 0, 0], MID = [0.15, 0.45, 0.30, 0.10, 0, 0, 0], LATE = [0.05, 0.10, 0.10, 0.20, 0.27, 0.28, 0], LAST = [0.04, 0.04, 0.04, 0.10, 0.34, 0.34, 0.10];
const n = (k, n) => ({ k, n });

// Each round: a short history, what students must place, how many newcomers arrive, and a question to discuss.
export const ROUNDS = [
  { year: 1837, name: 'A Town on the Prairie', arrive: 45, mix: EARLY,
    story: 'Chicago has just become a city of about 4,000 people. West of the river there is nothing but wet prairie and a few muddy trails. Land is cheap, and settlers from the East are buying lots.',
    build: [n(T.COTTAGE, 8), n(T.SHOP, 1), n(T.CHURCH, 1)],
    ask: 'Why did you put your first homes where you did?' },
  { year: 1848, name: 'The Canal and the Railroad', arrive: 75, mix: MID,
    story: 'In one year Chicago gets a canal linking the Great Lakes to the Mississippi and its first railroad. Grain and lumber pour in. Irish laborers who dug the canal and German craftsmen settle on the West Side.',
    build: [n(T.DEPOT, 1), n(T.LUMBER, 3), n(T.WORKSHOP, 2), n(T.COTTAGE, 10), n(T.SALOON, 1)],
    ask: 'Where did you put the depot and the lumber yards? What did that do to the land around them?' },
  { year: 1855, name: 'Cholera and Sewers', arrive: 70, mix: MID, epi: 'Cholera',
    story: 'Last year cholera killed more than 1,400 Chicagoans. It spreads through drinking water fouled by privies. The city is starting to build the first full sewer system in the country, raising whole streets out of the mud to do it. There is not enough money for every block.',
    build: [n('sewer', 4), n(T.COTTAGE, 10), n(T.SCHOOL, 1)],
    ask: 'You could only sewer four blocks. How did you choose? Who got left out?' },
  { year: 1865, name: 'Boom Town', arrive: 130, mix: MID,
    story: 'The Civil War made Chicago rich. The Union Stock Yards open this year, factories are rising along the river, and more lumber passes through Chicago than any city on earth. Almost everything in your ward is built of pine.',
    build: [n(T.FACTORY, 3), n(T.LUMBER, 3), n(T.COTTAGE, 14), n(T.SHOP, 2), n(T.SALOON, 1)],
    ask: 'Factories bring jobs and smoke. How close to them did you put people\'s homes?' },
  { year: 1871, name: 'The Great Fire', arrive: 160, mix: MID, fire: true,
    story: 'It has barely rained since July. The O\'Leary family has moved into a cottage on DeKoven Street with a barn out back. More families arrive every week, and landlords are squeezing extra houses into back yards.',
    build: [n(T.FIRE, 1), n(T.COTTAGE, 10), n('rear', 6)],
    ask: 'What burned and what did not? What made the difference?' },
  { year: 1872, name: 'Rebuilding', arrive: 200, mix: MID,
    story: 'A third of Chicago is homeless, and thousands of burned-out families are crossing into your ward. The city bans new wooden buildings downtown. Brick is safe but expensive, so working families keep building in pine wherever it is still allowed.',
    build: [n(T.BRICK, 8), n(T.COTTAGE, 12), n(T.WORKSHOP, 2), n('sewer', 3)],
    ask: 'Who could afford to rebuild in brick? What happened to everyone else?' },
  { year: 1877, name: 'Panic and Strike', arrive: 250, mix: LATE, econ: 0.65,
    story: 'Banks failed in 1873 and the hard times have not ended. Factories cut wages or close. This summer a national railroad strike reaches Chicago, and police and soldiers kill as many as thirty workers near the Halsted Street viaduct.',
    build: [n(T.WTEN, 10), n(T.FACTORY, 2), n(T.POLICE, 1), n(T.SALOON, 2)],
    ask: 'What happened to your people when jobs disappeared? Who was the police station built to protect?' },
  { year: 1882, name: 'New Neighbors', arrive: 650, mix: LATE,
    story: 'Good times return and so do the trains, now full of families from Italy, Bohemia, and the Russian Empire, where Jewish families are fleeing mob violence. Garment bosses open sweatshops. Chicago\'s first cable cars begin running.',
    build: [n('line', 1), n(T.WTEN, 12), n(T.SWEAT, 3), n(T.SHOP, 4), n(T.CHURCH, 1)],
    ask: 'Turn on the Nationalities map. Did you plan those neighborhoods? Who did?' },
  { year: 1889, name: 'The Boss and Hull House', arrive: 700, mix: LATE,
    story: 'Alderman Johnny Powers, a saloon keeper, runs your ward. He finds jobs for his voters and sells city contracts to the highest bidder. This fall Jane Addams and Ellen Gates Starr move into the neighborhood to open a settlement house.',
    build: [n(T.HULL, 1), n(T.BTEN, 10), n(T.BATH, 1), n(T.PARK, 2), n(T.SALOON, 2), n(T.SCHOOL, 1)],
    ask: 'Powers was corrupt. Why did so many neighbors vote for him anyway? What could Hull House do that the city was not doing?' },
  { year: 1893, name: 'White City, Gray City', arrive: 800, mix: LAST, econ: 0.65, epi: 'Typhoid',
    story: 'The World\'s Fair shows millions of visitors a perfect white city on the lakefront. Across town, typhoid from sewage-fouled water has killed thousands, banks are failing again, and jobless men sleep on the floors of City Hall. Soon electric trains will run on steel legs above the West Side.',
    build: [n('el', 1), n(T.BTEN, 12), n(T.FACTORY, 3), n(T.HOSP, 1), n('sewer', 4)],
    ask: 'The Fair proved Americans could build a clean, planned city. Why was your ward not built that way?' },
  { year: 1900, name: 'A New Century', arrive: 500, mix: LAST,
    story: 'Engineers have reversed the Chicago River so sewage flows away from the lake the city drinks from. Reformers are counting the people packed into every tenement and demanding laws for light, air, and plumbing. This is your last chance to change your ward.',
    build: [n(T.NEWTEN, 6), n('sewer', 6), n(T.PARK, 2), n(T.SCHOOL, 1), n(T.FIRE, 1)],
    ask: 'Was the growth of cities a benefit to American society? Use your own ward as evidence.' },
];

export const QUOTES = {
  shanty: ['We built it ourselves from boards off the lumber dock.', 'The water comes up through the floor when it rains.'],
  crowd3: ['Eleven of us sleep in three rooms. The baby sleeps in a drawer.', 'I rent a bed by the shift. A night man sleeps in it while I work.', 'Four families share one privy in the yard.'],
  crowd2: ['We rent the kitchen floor to two boarders. It pays for the coal.', 'My sister\'s family moved in with us. Where else would they go?'],
  nosewer: ['The privy vault overflows into the yard every spring.', 'We carry water from a pump in the alley. It smells.'],
  smoke: ['Mother hangs the wash white and takes it in gray.', 'The baby coughs all night. The doctor says it is the air.'],
  jobless: ['I stand at the factory gate every dawn. Forty men, three jobs.', 'It is an hour\'s walk to the nearest mill, and they are not hiring.'],
  elshadow: ['The train passes my window every four minutes. We have stopped hearing it.'],
  hull: ['I am learning English at Hull House at night. Miss Addams knows my name.'],
  school: ['My son can read the newspaper to me now.'],
  park: ['On Sunday the whole street walks to the park.'],
  good: ['We have two rooms, a window, and steady work. It is more than we had at home.', 'I am saving for a cottage of our own.', 'This is a hard city. It is still better than where we came from.'],
};
export const JOBS = ['laundry worker', 'lumber shover', 'teamster', 'garment worker', 'machinist', 'peddler', 'day laborer', 'cigar roller', 'hod carrier', 'factory hand', 'fruit seller', 'rag picker'];
