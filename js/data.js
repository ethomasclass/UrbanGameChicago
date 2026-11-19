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
  SHOP: 10, SALOON: 11, STORE: 12, MARKET: 13, BOSS: 14,
  WORKSHOP: 20, FACTORY: 21, LUMBER: 22, SWEAT: 23, RAIL: 24, ELEV: 25, GAS: 26,
  RUBBLE: 30,
  FIRE: 40, POLICE: 41, SCHOOL: 42, CHURCH: 43, PARK: 44, BATH: 45, HOSP: 46, HULL: 47, DEPOT: 48, BARN: 49, STPAT: 50,
};

// cap = people it was built to hold. flam = how easily it burns. poll = smoke it makes. r = how far its help reaches.
export const B = {
  [T.EMPTY]: { name: 'Empty lot', cap: 0, jobs: 0, flam: 0, poll: 0 },
  [T.SHANTY]: { icon: '⛺', name: 'Squatter shanty', cap: 5, jobs: 0, flam: 1.3, poll: 0, note: 'Nobody planned this. A family with nowhere else to go nailed it together from scrap lumber.' },
  [T.COTTAGE]: { icon: '🏠', name: 'Frame cottage', cap: 6, jobs: 0, flam: 1, poll: 0, note: 'A one-story pine cottage, cheap and quick to build.', tip: '<b>Mill owner:</b> "Build them next to the works. A man should hear the whistle from his bed." <b>Doctor:</b> "Build them upwind, and near clean water."' },
  [T.REAR]: { icon: '🏚️', name: 'Cottage with rear house', cap: 14, jobs: 0, flam: 1.1, poll: 0, note: 'The landlord built a second house in the back yard to collect more rent.' },
  [T.WTEN]: { icon: '🏢', name: 'Frame tenement', cap: 30, jobs: 0, flam: 1.15, poll: 0, note: 'Three floors of pine, many families, one outdoor privy.', tip: '<b>Landlord:</b> "Tear down a cottage and I can fit five families where one lived." It can also go on an empty lot.' },
  [T.BRICK]: { icon: '🧱', name: 'Brick home', cap: 8, jobs: 0, flam: 0.3, poll: 0, note: 'Solid and safer from fire, but too costly for most newcomers.', tip: 'Brick can go on burned lots.' },
  [T.BTEN]: { icon: '🏬', name: 'Brick tenement', cap: 40, jobs: 0, flam: 0.35, poll: 0, note: 'Four floors of small dark rooms. Many have no window at all.', tip: '<b>Landlord:</b> "Forty tenants on one lot. Windows are extra." Goes on an empty lot, or click an older home to replace it.' },
  [T.NEWTEN]: { icon: '🏘️', name: 'Reform tenement', cap: 28, jobs: 0, flam: 0.3, poll: 0, note: 'Built to the reformers\' rules: a window in every room and a court for light and air.', tip: 'Healthier than any other tenement. Goes on an empty lot or replaces an older home.' },
  [T.SHOP]: { icon: '🏪', name: 'Shop', cap: 0, jobs: 5, flam: 1, poll: 0, r: 4, note: 'A grocer, baker, or dry goods store with the family living upstairs.', tip: 'People like a shop close to home.' },
  [T.SALOON]: { icon: '🍺', name: 'Saloon', cap: 0, jobs: 3, flam: 1, poll: 0, r: 3, note: 'The working man\'s club, bank, and hiring hall. Also where the ward boss does business.', tip: 'The neighborhood gathering place.' },
  [T.WORKSHOP]: { icon: '🔨', name: 'Workshop', cap: 0, jobs: 25, flam: 1, poll: 0.6, note: 'A planing mill, wagon shop, or small foundry.', tip: '<b>Owner:</b> "Near the river and the rails, where the freight is." <b>Neighbor:</b> "Anywhere but upwind of me." The wind blows toward the northeast.' },
  [T.FACTORY]: { icon: '🏭', name: 'Factory', cap: 0, jobs: 90, flam: 0.4, poll: 1.5, note: 'Steam power, long shifts, and a smokestack that never rests.', tip: '<b>Owner:</b> "Close to my workers, so nobody is late." <b>Mother:</b> "Then you breathe it." The wind blows toward the northeast.' },
  [T.LUMBER]: { icon: '🪵', name: 'Lumber yard', cap: 0, jobs: 30, flam: 1.7, poll: 0.25, note: 'Stacks of dry pine from the north woods. Good jobs. One spark away from disaster.', tip: '<b>Lumberman:</b> "On the water, where the schooners unload." <b>Fire marshal:</b> "Nowhere near houses. It is a bonfire waiting for a match."' },
  [T.SWEAT]: { icon: '🧵', name: 'Garment sweatshop', cap: 0, jobs: 60, flam: 0.4, poll: 0.3, note: 'Rows of sewing machines. Many of the workers are children.', tip: '<b>Garment boss:</b> "Put me close to the tenements. The girls can come straight from breakfast."' },
  [T.MARKET]: { icon: '🛒', name: 'Maxwell Street Market', label: 'Maxwell Street Market', cap: 0, jobs: 40, flam: 1, poll: 0, r: 6, note: 'Pushcarts, pickles, chickens, secondhand shoes, and bargaining in six languages.', tip: '<b>Peddler:</b> "Put us where the crowds are." <b>Housewife:</b> "Put it where I can walk to it."' },
  [T.BOSS]: { icon: '🎩', name: "Powers's saloon", label: "Powers's saloon", cap: 0, jobs: 45, flam: 0.5, poll: 0, r: 5, note: 'Alderman Johnny Powers holds court here. Jobs, favors, and funerals arranged at the bar.', tip: '<b>Powers:</b> "Put me where the voters are, and nobody on this street goes without a job."' },
  [T.ELEV]: { icon: '🌾', name: 'Grain elevator', label: 'Grain elevator', cap: 0, jobs: 35, flam: 1.5, poll: 0.3, note: 'A wooden tower that lifts prairie wheat out of rail cars and pours it into lake ships.', tip: '<b>Grain dealer:</b> "It has to touch both the rails and the water." It is also the tallest thing in the ward, and it is made of pine.' },
  [T.GAS]: { icon: '🔥', name: 'Gas works', label: 'Gas works', cap: 0, jobs: 40, flam: 1.2, poll: 1.3, note: 'Coal is baked here to make gas for the city\'s street lamps. The smell reaches for blocks.', tip: '<b>Gas company:</b> "Everyone wants gaslight." <b>Everyone:</b> "Not next to my house."' },
  [T.STPAT]: { icon: '⛪', name: "St. Patrick's Church", label: "St. Patrick's", cap: 0, jobs: 3, flam: 0.3, poll: 0, r: 6, note: 'Built by Irish immigrants in the 1850s. It is still standing today, the oldest public building in Chicago.', tip: '<b>Father Dunne:</b> "Build it where the Irish families are. They paid for it a nickel at a time."' },
  [T.RUBBLE]: { name: 'Burned ruins', cap: 0, jobs: 0, flam: 0, poll: 0, note: 'Ashes, and a chimney.' },
  [T.FIRE]: { icon: '🚒', name: 'Fire station', cap: 0, jobs: 8, flam: 0.2, poll: 0, r: 6, note: 'A steam engine, horses, and a watchtower.', tip: '<b>Fire marshal:</b> "I can only save what I can reach. What do you most want to keep?"' },
  [T.POLICE]: { icon: '👮', name: 'Police station', cap: 0, jobs: 8, flam: 0.2, poll: 0, r: 6, note: 'Keeps order. Whose order is another question.', tip: 'What, or who, should it be close to?' },
  [T.SCHOOL]: { icon: '🏫', name: 'Public school', cap: 0, jobs: 8, flam: 0.3, poll: 0, r: 5, note: 'Every child in a classroom is a child out of the factory.', tip: '<b>Teacher:</b> "A six-year-old cannot walk a mile through mud. Put it where the children are."' },
  [T.CHURCH]: { icon: '⛪', name: 'Church or synagogue', cap: 0, jobs: 2, flam: 0.5, poll: 0, r: 5, note: 'The heart of an immigrant neighborhood.', tip: 'Newcomers settle close to their own.' },
  [T.PARK]: { icon: '🌳', name: 'Small park', cap: 0, jobs: 0, flam: 0, poll: 0, r: 3, note: 'Grass, trees, and air.', tip: '<b>Reformer:</b> "Put it where the children have nowhere else to play." <b>Landlord:</b> "That lot could hold forty tenants."' },
  [T.BATH]: { icon: '🛁', name: 'Public bath', cap: 0, jobs: 4, flam: 0.2, poll: 0, r: 4, note: 'Most tenement families have no bathtub.', tip: 'Helps the health of homes nearby.' },
  [T.HOSP]: { icon: '🏥', name: 'County Hospital', label: 'County Hospital', cap: 0, jobs: 25, flam: 0.2, poll: 0, r: 8, note: 'Care for the sick and injured.', tip: 'Helps the health of a wide area.' },
  [T.HULL]: { icon: '🏛️', name: 'Hull House', label: 'Hull House', cap: 0, jobs: 6, flam: 0.3, poll: 0, r: 7, note: 'A settlement house: kindergarten, night classes, clubs, and a door that is always open.', tip: 'Jane Addams chose to live among the poorest families. Where are yours?' },
  [T.DEPOT]: { icon: '🚂', name: 'Rail depot', label: 'The Depot', cap: 0, jobs: 30, flam: 0.3, poll: 0.8, note: 'Where the newcomers step off the train.', tip: '<b>Railroad man:</b> "By the river, to meet the boats." Trains bring people, freight, noise, and soot.' },
  [T.BARN]: { name: "O'Leary barn", label: "O'Leary barn", cap: 0, jobs: 0, flam: 2, poll: 0, note: 'Catherine O\'Leary keeps five cows here and sells milk to her neighbors.' },
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
    ask: 'Why did you put your first homes where you did?',
    scene: 'Chicagoans joke about a sign stuck in a downtown mudhole: NO BOTTOM HERE. In the joke a hat lies next to the sign, and under the hat is a man who says not to worry, he still has a good horse under him.' },
  { year: 1848, name: 'The Canal and the Railroad', arrive: 75, mix: MID,
    story: 'In one year Chicago gets a canal linking the Great Lakes to the Mississippi and its first railroad. Grain and lumber pour in. Irish laborers who dug the canal and German craftsmen settle on the West Side.',
    build: [n(T.DEPOT, 1), n(T.ELEV, 1), n(T.LUMBER, 3), n(T.WORKSHOP, 2), n(T.COTTAGE, 10), n(T.SALOON, 1)],
    ask: 'Where did you put the depot and the lumber yards? What did that do to the land around them?',
    scene: 'Chicago\'s first locomotive, the Pioneer, arrives this year the only way it can: by boat.' },
  { year: 1855, name: 'Cholera and Sewers', arrive: 70, mix: MID, epi: 'Cholera',
    story: 'Last year cholera killed more than 1,400 Chicagoans. It spreads through drinking water fouled by privies. The city is starting to build the first full sewer system in the country, raising whole streets out of the mud to do it. There is not enough money for every block.',
    build: [n('sewer', 4), n(T.COTTAGE, 10), n(T.STPAT, 1), n(T.SCHOOL, 1)],
    ask: 'You could only sewer four blocks. How did you choose? Who got left out?',
    scene: 'To make room for the pipes, crews are jacking whole buildings up out of the mud with thousands of screws. In a few years they will raise a brick hotel while the guests stay inside eating dinner.' },
  { year: 1865, name: 'Boom Town', arrive: 130, mix: MID,
    story: 'The Civil War made Chicago rich. The Union Stock Yards open this year, factories are rising along the river, and more lumber passes through Chicago than any city on earth. Almost everything in your ward is built of pine.',
    build: [n(T.FACTORY, 3), n(T.GAS, 1), n(T.LUMBER, 2), n(T.COTTAGE, 14), n(T.SHOP, 2), n(T.SALOON, 1)],
    ask: 'Factories bring jobs and smoke. How close to them did you put people\'s homes?',
    scene: 'The new stock yards can hold more than 100,000 animals. People say the packers use every part of the pig except the squeal.' },
  { year: 1871, name: 'The Great Fire', arrive: 160, mix: MID, fire: true,
    story: 'It has barely rained since July. The O\'Leary family has moved into a cottage on DeKoven Street with a barn out back. More families arrive every week, and landlords are squeezing extra houses into back yards.',
    build: [n(T.FIRE, 1), n(T.COTTAGE, 10), n('rear', 6)],
    ask: 'What burned and what did not? What made the difference?',
    scene: 'Chicago has more than fifty miles of streets paved with pine blocks and hundreds of miles of raised wooden sidewalks. The fire department has 185 men.' },
  { year: 1872, name: 'Rebuilding', arrive: 200, mix: MID,
    story: 'A third of Chicago is homeless, and thousands of burned-out families are crossing into your ward. The city bans new wooden buildings downtown. Brick is safe but expensive, so working families keep building in pine wherever it is still allowed.',
    build: [n(T.BRICK, 8), n(T.COTTAGE, 12), n(T.WORKSHOP, 2), n('sewer', 3)],
    ask: 'Who could afford to rebuild in brick? What happened to everyone else?',
    scene: 'The day after the fire, real estate man William Kerfoot nailed together a shack in the ashes and hung out a sign: ALL GONE BUT WIFE, CHILDREN, AND ENERGY.' },
  { year: 1877, name: 'Panic and Strike', arrive: 250, mix: LATE, econ: 0.65,
    story: 'Banks failed in 1873 and the hard times have not ended. Factories cut wages or close. This summer a national railroad strike reaches Chicago, and police and soldiers kill as many as thirty workers near the Halsted Street viaduct.',
    build: [n(T.WTEN, 10), n(T.FACTORY, 2), n(T.POLICE, 1), n(T.SALOON, 2)],
    ask: 'What happened to your people when jobs disappeared? Who was the police station built to protect?',
    scene: 'Thousands of Chicago children work as newsboys, bootblacks, and messengers. Some of them sleep in doorways with tomorrow\'s papers for a pillow.' },
  { year: 1882, name: 'New Neighbors', arrive: 650, mix: LATE,
    story: 'Good times return and so do the trains, now full of families from Italy, Bohemia, and the Russian Empire, where Jewish families are fleeing mob violence. Garment bosses open sweatshops. Chicago\'s first cable cars begin running.',
    build: [n('line', 1), n(T.WTEN, 12), n(T.SWEAT, 3), n(T.MARKET, 1), n(T.SHOP, 2), n(T.CHURCH, 1)],
    ask: 'Turn on the Nationalities map. Did you plan those neighborhoods? Who did?',
    scene: 'One branch of the river near the stock yards is so full of rotting waste that it bubbles. Chicagoans name it Bubbly Creek. Chickens are said to walk across it.' },
  { year: 1889, name: 'The Boss and Hull House', arrive: 700, mix: LATE,
    story: 'Alderman Johnny Powers, a saloon keeper, runs your ward. He finds jobs for his voters and sells city contracts to the highest bidder. This fall Jane Addams and Ellen Gates Starr move into the neighborhood to open a settlement house.',
    build: [n(T.HULL, 1), n(T.BOSS, 1), n(T.BTEN, 10), n(T.BATH, 1), n(T.PARK, 2), n(T.SALOON, 1), n(T.SCHOOL, 1)],
    ask: 'Powers was corrupt. Why did so many neighbors vote for him anyway? What could Hull House do that the city was not doing?',
    scene: 'For Hull House\'s first evening gathering, Ellen Starr reads a long English novel aloud, in Italian, to the neighbors. The neighbors are very polite about it.' },
  { year: 1893, name: 'White City, Gray City', arrive: 800, mix: LAST, econ: 0.65, epi: 'Typhoid',
    story: 'The World\'s Fair shows millions of visitors a perfect white city on the lakefront. Across town, typhoid from sewage-fouled water has killed thousands, banks are failing again, and jobless men sleep on the floors of City Hall. Soon electric trains will run on steel legs above the West Side.',
    build: [n('el', 1), n(T.BTEN, 12), n(T.FACTORY, 3), n(T.HOSP, 1), n('sewer', 4)],
    ask: 'The Fair proved Americans could build a clean, planned city. Why was your ward not built that way?',
    scene: 'The Fair\'s Ferris wheel is 264 feet tall. Each of its 36 cars holds 60 people. A ride costs fifty cents, the same as a ticket to the whole Fair.' },
  { year: 1900, name: 'A New Century', arrive: 500, mix: LAST,
    story: 'Engineers have reversed the Chicago River so sewage flows away from the lake the city drinks from. Reformers are counting the people packed into every tenement and demanding laws for light, air, and plumbing. This is your last chance to change your ward.',
    build: [n(T.NEWTEN, 6), n('sewer', 6), n(T.PARK, 2), n(T.SCHOOL, 1), n(T.FIRE, 1)],
    ask: 'Was the growth of cities a benefit to American society? Use your own ward as evidence.',
    scene: 'St. Louis is downstream. It sues to stop Chicago\'s sewage from arriving. It loses.' },
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

// Two families students follow through the game. Each moves into a home the student places, and what
// happens to them depends on what the student built around that home. c = conditions at their door:
// sewer, smoke, job, hull, school, park, transit, burned, rear (landlord added a rear house), health.
export const FAMILIES = [
  { id: 'malone', face: 'bridget', name: 'The Malones', start: 1, kind: T.COTTAGE, beats: {
    1: c => `Michael and Bridget Malone step off a canal boat with a trunk, a fiddle, and a baby. He helped dig the canal. Now it is finished, and so is his job. They rent the first cottage you built this round${c.smoke ? ', downwind of the yards. Bridget says the air tastes like a blacksmith.' : c.job ? ', a short walk from the docks. Michael starts Monday.' : ', a long way from anything. Michael walks an hour each morning to find a day\'s work.'}`,
    2: c => c.sewer ? 'Cholera came down the Malones\' street and passed their door. Bridget credits the new sewer pipe and Saint Patrick, in that order.' : 'The Malones\' youngest, Tommy, two years old, died of cholera in August. It took one day. Bridget kept his shoes.',
    3: c => 'Danny Malone, 17, is home from the Union Army in one piece. ' + (c.smoke ? 'The first thing he says is that the war smelled better than this street.' : c.job ? 'He is hired at the lumber yard by Friday. Bridget cries at both pieces of news.' : 'There is no work near home, so he boards by the river and visits on Sundays.'),
    4: c => c.burned ? 'The Malones ran from the fire carrying the fiddle, the clock, and the family Bible. Everything else they owned is ash. Tonight they sleep eleven to a room at a cousin\'s.' : 'The fire missed the Malones. Bridget fed nineteen strangers that week and never once asked where they went to church.',
    5: c => c.rear ? 'The landlord has built a rear house in the Malones\' yard. Bridget\'s garden is under it. He raised the rent anyway.' : 'Danny Malone lays brick now. Since the fire there has never been so much work in Chicago, and he has never been so tired.',
    6: c => 'Danny Malone was at the viaduct when the soldiers came. He walked home with a cracked head. He tells his mother he fell.' + (c.job ? '' : ' There has been no pay in the house since March.'),
    7: c => 'Mary Malone has married a German butcher\'s son, to the horror of both families. The wedding was excellent. ' + (c.transit ? 'The young couple rides the new streetcar out to a cottage with a yard.' : 'The young couple moves in upstairs, because where else is there?'),
    8: c => c.hull ? 'Nora, Bridget\'s granddaughter, goes to the kindergarten at Hull House. She has informed the family that she intends to be Miss Addams.' : c.school ? 'Nora, Bridget\'s granddaughter, is the first Malone to finish the sixth grade. Bridget has the certificate framed over the stove.' : 'Nora, Bridget\'s granddaughter, is ten. She pulls basting threads in a garment shop eleven hours a day. She is very quick. The boss says so.',
    9: c => c.sewer ? 'Nora Malone spent two days\' wages to ride the Ferris wheel. She says that from the top you cannot see the smoke, only the lake. Michael says that is a great deal of money to not see something.' : 'Typhoid took Michael Malone in the spring. Forty-five years in Chicago, and it was the water that got him. Alderman Powers paid for the funeral. The Malone men will vote for him until they die.',
    10: c => 'Bridget Malone is 77, the last person on the block who remembers the prairie. "It was all grass," she tells the children. "You could hear the frogs." Nobody believes her.' + (c.park ? ' Most afternoons she sits in the new park, facing west.' : ''),
  } },
  { id: 'rossi', face: 'rosa', name: 'The Rossis', start: 7, kind: T.WTEN, beats: {
    7: () => 'Giuseppe and Rosa Rossi arrive from a village near Naples with four children and an address written on a card. Eight people now share three rooms in the first tenement you built this round. Giuseppe sells bananas from a pushcart. He had never seen a banana until last year.',
    8: c => c.hull ? 'Rosa Rossi takes English lessons at Hull House two nights a week. Her first complete sentence is a complaint about the landlord. Her teacher is delighted.' : 'Alderman Powers found Giuseppe Rossi a job sweeping streets. Giuseppe is not sure what an alderman is, but he knows who he is voting for.',
    9: c => !c.sewer ? 'The Rossis\' baby, Antonio, died of typhoid in July. He was the third child on their stairway that month. Rosa has stopped taking in boarders. She says the rooms are full enough.' : c.health < 55 ? 'Lucia Rossi, 12, coughs all winter. The doctor says she needs clean air and rest. Rosa asks him where those are sold.' : 'The factories are on short hours, but Giuseppe\'s pushcart did well outside the Fair. The family ate meat twice in one week. Rosa suspects him of something.',
    10: c => c.reform || c.park ? 'The Rossis have daylight in every room now. Rosa opens all the windows every morning, even in January, because she can.' : 'Lucia Rossi, 19, keeps the family\'s accounts in English and scolds her father in Italian. Giuseppe says America has ruined her. He says it proudly.',
  } },
];

// ---------- the cast ----------
// Everyone who speaks in the game. real: true marks a historical person; the rest are invented.
// look, beard, collar, and color only shape the placeholder portrait that shows until real art is added (see docs/FLOW.md).
export const CHARACTERS = {
  pike: { name: 'Harlan Pike', role: 'Mill owner', look: 'top', color: '#c9b38a' },
  voss: { name: 'Dr. Ada Voss', role: 'Physician', look: 'bun', color: '#a9bcc8' },
  crane: { name: 'Josiah Crane', role: 'Landlord', look: 'bowler', beard: true, color: '#a7b094' },
  doyle: { name: 'Marshal Doyle', role: 'Fire marshal', look: 'cap', color: '#d0a08c' },
  whitlow: { name: 'Miss Whitlow', role: 'Schoolteacher', look: 'bun', color: '#d6c79c' },
  lund: { name: 'Captain Lund', role: 'Lumber shipper', look: 'cap', beard: true, color: '#8fb4bc' },
  beck: { name: 'Mr. Beck', role: 'Garment contractor', look: 'bowler', color: '#b5a8c6' },
  dunne: { name: 'Father Dunne', role: "Pastor of St. Patrick's", look: 'none', collar: true, color: '#aabc9c', real: true },
  addams: { name: 'Jane Addams', role: 'Founder of Hull House', look: 'bun', color: '#d8b4a4', real: true },
  powers: { name: 'Johnny Powers', role: 'Alderman', look: 'top', beard: true, color: '#a4bd94', real: true },
  bridget: { name: 'Bridget Malone', role: 'Your neighbor', look: 'shawl', color: '#96c4a0' },
  rosa: { name: 'Rosa Rossi', role: 'Your neighbor', look: 'shawl', color: '#9fb4dc' },
};
const a = (who, say, from = 0) => ({ who, say, from });
// Advice for each thing on the build list. The game shows the first two voices who are in the ward by that round (from = round index).
// They are written to disagree. The game never says who is right.
export const ADVICE = {
  [T.COTTAGE]: [a('pike', 'Build them next to the works. A man should hear the whistle from his bed.'), a('voss', 'Build them upwind, and near clean water.')],
  [T.SHOP]: [a('bridget', 'I will not carry flour a mile through the mud. Put it by the houses.', 1), a('crane', 'A shop wants customers. Put it where the people are.')],
  [T.CHURCH]: [a('dunne', 'Newcomers settle near their own church. Build it and they will come to it.', 2), a('whitlow', 'People will walk a long way to church. They would rather not.')],
  [T.DEPOT]: [a('lund', 'By the river, so the rail cars can meet the boats.'), a('voss', 'Trains mean soot and noise. Keep the bedrooms back from the tracks.')],
  [T.ELEV]: [a('lund', 'It has to touch the rails and the water both.'), a('doyle', 'It is the tallest thing in the ward and it is made of pine. Think about what stands next to it.')],
  [T.LUMBER]: [a('lund', 'On the water, where the schooners unload.'), a('doyle', 'Nowhere near houses. It is a bonfire waiting for a match.')],
  [T.WORKSHOP]: [a('pike', 'Near the river and the rails, where the freight is.'), a('bridget', 'Anywhere but upwind of my washing. The wind blows to the northeast.', 1), a('voss', 'The wind blows to the northeast. So will the smoke.')],
  [T.SALOON]: [a('pike', 'Not next to my gates. I want them sober at six.'), a('crane', 'Put a saloon on the corner and the whole block rents faster.')],
  sewer: [a('voss', 'Cholera follows the privies. Pipe the blocks where the most people live.'), a('crane', 'Pipe my blocks first. The rents will double.')],
  [T.STPAT]: [a('dunne', 'Build it where the Irish families are. They paid for it a nickel at a time.')],
  [T.SCHOOL]: [a('whitlow', 'A six-year-old cannot walk a mile through mud. Put it where the children are.'), a('pike', 'A school near the mill only gives the boys ideas.')],
  [T.FACTORY]: [a('pike', 'Close to my workers, so nobody is late.'), a('bridget', 'Then you come and breathe it, Mr. Pike.', 1)],
  [T.GAS]: [a('pike', 'Everyone wants gaslight.'), a('voss', 'And nobody should have to live beside where it is made.')],
  [T.FIRE]: [a('doyle', 'I can only save what I can reach. What do you most want to keep?')],
  rear: [a('crane', 'A yard is wasted rent. I can fit a second house back there.'), a('bridget', 'That was my garden.', 1)],
  [T.BRICK]: [a('crane', 'Brick on the burned lots. It will not burn twice.'), a('bridget', 'And who do you think can pay brick rents?', 1)],
  [T.WTEN]: [a('crane', 'Tear down a cottage and I can fit five families where one lived.'), a('voss', 'Five families and one privy. Put them on sewered blocks, at least.')],
  [T.POLICE]: [a('pike', 'Near the factories. That is what needs protecting.'), a('bridget', 'Near the saloons, if you want my opinion.', 1)],
  line: [a('crane', 'Run it past my lots and watch the prices climb.'), a('voss', 'Run it where it lets people live farther from the smoke.')],
  [T.SWEAT]: [a('beck', 'Close to the tenements. The girls can come straight from breakfast.'), a('voss', 'Children work those machines. Keep it off your worst blocks, at least.')],
  [T.MARKET]: [a('bridget', 'Put it where I can walk to it.', 1), a('pike', 'Keep the pushcarts off my street. They block the wagons.')],
  [T.HULL]: [a('addams', 'We mean to live where we are needed most. Where are your poorest neighbors?'), a('powers', 'Ladies with books. Put them wherever you like. They will not last the winter.')],
  [T.BOSS]: [a('powers', 'Put me where the voters are, and nobody on that street goes without a job.'), a('addams', 'He will buy this ward one favor at a time.')],
  [T.BTEN]: [a('crane', 'Forty tenants on one lot. Windows are extra.'), a('rosa', 'We live in the room with no window. Give the next family a block with a sewer, at least.', 8)],
  [T.BATH]: [a('addams', 'Most of our neighbors have no bathtub. Put it where the tenements are thickest.')],
  [T.PARK]: [a('addams', 'Put it where the children have nowhere else to play.'), a('crane', 'That lot could hold forty tenants.')],
  el: [a('crane', 'Fast trains. My lots along the line will be worth a fortune.'), a('rosa', 'It will run past somebody\'s bedroom window. You are choosing whose.', 8)],
  [T.HOSP]: [a('voss', 'A hospital does the most good where people are sickest. Look at your Health map.')],
  [T.NEWTEN]: [a('addams', 'A window in every room. Tear down the worst buildings and put these in their place.'), a('crane', 'Fewer tenants on every lot. You are costing me money.')],
};
// one plain line on how to place each kind of thing
export const howTo = k => k === 'sewer' ? 'Click a block.' : k === 'line' || k === 'el' ? 'Click a street.' : k === 'rear' ? 'Click one of your frame cottages.' : k === T.WTEN || k === T.BTEN || k === T.NEWTEN ? 'Click an empty lot, or an older home to replace it.' : k === T.BRICK ? 'Click an empty lot or a burned one.' : 'Click an empty lot.';
