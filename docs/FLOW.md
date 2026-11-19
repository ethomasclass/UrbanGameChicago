# Making the game's art in Google Flow

Everything that is not the 3D city can be replaced with generated art: portraits, build icons, a banner for each round's history card, and title art. This is the shot list, with a prompt for each piece and the exact file name to save it under.

## How it plugs in

1. Generate an image in Flow and download it.
2. Rename it as listed below and put it in the matching folder under `art/raw/` (upload through GitHub with **Add file, Upload files**, or send the files to Claude).
3. Run `python3 tools/art.py`. It crops and resizes everything, removes the background from icons, and updates `assets/manifest.json`.
4. Reload the game. Anything you have not made yet keeps its placeholder, so you can do this a few pieces at a time.

PNG, JPG, and WebP all work. Size does not matter as long as it is at least about 800 pixels on the short side.

## Step one: make a style anchor

Consistency across 45 images is the hard part. Do this first and do not skip it.

1. Generate the **young Bridget Malone** portrait (below) until you have one you love.
2. Keep that image in your Flow project and add it as a reference image to **every** later prompt, with the line: *"Match the illustration style, palette, and brushwork of the reference image exactly. Different subject."*
3. If a result drifts (outlines appear, colors multiply, it turns photographic), regenerate. Do not accept "close."

## The style block

Paste this at the end of every prompt.

> Flat-color digital illustration with no outlines. Forms built from clean, hard-edged planes of color, two or three tones per surface. Limited palette: warm cream background, deep teal and navy for clothing and shadow, natural skin tones, and one warm accent color. Light from the upper left. Subtle paper grain. Plain cream background with nothing behind the subject. No text, no lettering, no border, no frame, no watermark.

Checks for every image before you keep it:

- Shrink it to thumbnail size. Can you still tell who or what it is?
- Nothing modern: no zippers, plastic, eyeglass styles after 1900, modern haircuts.
- No words. Generated lettering is unreliable and the game supplies all text.

## Portraits (14 images)

Aspect ratio **3:4**. Save into `art/raw/portraits/`.

Advisers are shown **waist-up**, standing in an arched frame beside what they say, so hands and a prop matter as much as the face.

Template: *"Waist-up portrait of [who], standing, turned three-quarters toward the viewer, [expression], [what the hands are doing]. [clothing]. Chicago, [year]. The top of the head is near the top of the frame. The figure fades into dry-brush spatter at the bottom edge."* then the style block.

Give every character something to do with their hands: Pike with thumbs in his waistcoat, Dr. Voss holding a medical bag, Crane counting rent money, Doyle resting a hand on an axe, Miss Whitlow holding a slate, Lund with a pipe, Beck pulling his tape measure, Father Dunne with a prayer book, Addams with a ledger, Powers offering a cigar, Bridget holding a laundry basket, Rosa with a market basket.

| File name | Who and what to ask for |
| --- | --- |
| `bridget` | An Irish immigrant woman of 25, auburn hair under a dark wool shawl, plain dress. Tired, determined. 1848. Accent: the auburn hair. **This is your style anchor.** |
| `bridget-2` | The same woman at 48, hair streaked grey, same shawl. Wry, unimpressed. 1871. Use `bridget` as a character reference. |
| `bridget-3` | The same woman at 77, white hair, deep lines, same shawl. Gentle, far-away look. 1900. |
| `rosa` | An Italian immigrant woman of 30, dark hair under a patterned headscarf tied at the nape, small gold hoop earrings, apron. Wary, proud. 1882. Accent: a warm red scarf. |
| `pike` | A prosperous mill owner of 50, heavy side whiskers, black silk top hat, dark frock coat, gold watch chain. Satisfied, appraising. 1865. Accent: gold. |
| `voss` | A woman physician of 40, hair pinned in a low bun, round wire spectacles, high white collar with a small brooch, dark fitted jacket. Calm, direct. 1870. Accent: a rust-red brooch. |
| `crane` | A landlord of 55, full grey beard, bowler hat, checked waistcoat, cigar. Shrewd half-smile. 1875. Accent: a mustard waistcoat. |
| `doyle` | A fire marshal of 45, mustache, 1870s leather fire helmet, double-breasted uniform with brass buttons. Exhausted, steady. 1871. Accent: brass. |
| `whitlow` | A schoolteacher of 28, hair in a neat braided crown, plain high-collared dress with a cameo. Patient, a little stern. 1860. Accent: soft coral. |
| `lund` | A Scandinavian lake captain of 50, weathered face, short grey beard, peaked cap, heavy pea coat, pipe. Squinting into wind. 1855. Accent: an orange scarf. |
| `beck` | A garment contractor of 40, thin, shirtsleeves and vest, tape measure around his neck, pencil behind his ear. Brisk, impatient. 1885. Accent: the orange tape measure. |
| `dunne` | An Irish Catholic priest of 45, clean-shaven, black cassock with white collar. Kindly, firm. 1855. Accent: none; keep him in teal and black. |
| `addams` | Jane Addams at about 30: dark hair parted in the middle and drawn back, dark high-necked dress with a small pin. Serious, gentle. 1889. **Add a period photograph of her as a reference so it looks like her.** Accent: muted rose. |
| `powers` | Chicago alderman Johnny Powers at about 37, a stocky saloon keeper: derby hat, diamond stickpin, cigar. Genial, calculating. 1889. **Use a period photograph as a reference if you can find one.** Accent: a green waistcoat. |

Bridget's three ages switch automatically (1848, from 1871, from 1889). Any other character can get the same treatment by adding `-2` and `-3` files.

## Build icons (29 images)

Aspect ratio **1:1**. Save into `art/raw/icons/`. The script removes the background, so the background must be one plain flat color with no shadow and no texture, and the object must not touch the edges.

Template: *"A single [object], centered, seen from a slight three-quarter angle from above, filling most of the frame. Simple, bold shapes that read at small size. Perfectly flat plain cream background, no ground shadow, nothing else in the image."* then the style block (leave out the paper grain sentence for icons).

| File name | Object |
| --- | --- |
| `cottage` | a small one-story wooden workers' cottage with a gable roof and a front step, 1850s |
| `rear` | a small wooden cottage with a second, taller house crammed directly behind it |
| `shanty` | a lopsided shack nailed together from scrap boards |
| `wten` | a three-story wooden tenement with an outside back staircase |
| `brick` | a narrow two-story brick house with a stone stoop |
| `bten` | a four-story brick tenement with rows of small windows and a cornice |
| `newten` | a brick tenement shaped like a U around an open courtyard, with a window in every room |
| `shop` | a small false-front general store with a striped awning |
| `saloon` | a corner saloon with swinging doors and beer barrels outside |
| `market` | a street market of pushcarts under colored awnings |
| `boss` | a derby hat and a cigar resting on a ballot box |
| `workshop` | a low wooden workshop with a single thin smokestack |
| `factory` | a brick factory with a sawtooth roof and one tall smoking chimney |
| `lumber` | neat stacks of pine boards in a lumber yard |
| `sweat` | a treadle sewing machine with a half-sewn coat |
| `elev` | a tall wooden grain elevator beside railroad tracks |
| `gas` | a round iron gas holder inside a tall iron frame |
| `depot` | a steam locomotive at a small depot with a clock tower |
| `fire` | a horse-drawn steam fire engine |
| `police` | a nineteenth-century police helmet and a wooden baton |
| `school` | a brick schoolhouse with a bell cupola and a flag |
| `church` | a small wooden church with a steeple |
| `stpat` | a cream brick church with two front towers of different heights, one with a spire and one with a dome |
| `park` | a small city park with four trees and a bandstand |
| `bath` | a washbasin, pitcher, and folded towel |
| `hosp` | a white hospital building with a red cross over the door |
| `hull` | a two-story Italianate brick house with a white columned porch and a cupola |
| `sewer` | a round iron manhole cover set in cobblestones with a brick sewer pipe showing in cutaway beneath |
| `line` | a horse-drawn streetcar on rails |
| `el` | an elevated train on steel legs above a street |

(`shanty` is not on any build list but shows up in tooltips later.)

## Round banners (11 images)

Aspect ratio **16:9**. Save into `art/raw/rounds/`, named by year. The script keeps only a wide band across the middle, so put the subject in the middle third and let the top and bottom be empty sky and ground.

Template: *"A wide scene: [scene]. Seen from a distance, small figures, strong horizon line."* then the style block.

| File name | Scene |
| --- | --- |
| `1837` | flat wet prairie with a muddy wagon trail, one cabin, and a few surveyors' stakes; a small town across a river in the distance |
| `1848` | a canal boat and a tiny early locomotive side by side at a river dock stacked with grain sacks and lumber |
| `1855` | workers turning jackscrews to lift a brick building out of the mud while sewer pipe is laid in a trench |
| `1865` | endless cattle pens and smoking factory chimneys at dusk, lumber schooners on the river |
| `1871` | a city skyline on fire at night, a river in the foreground crowded with fleeing people on a bridge |
| `1872` | bricklayers on scaffolding rebuilding among charred ruins, wooden shanties in front |
| `1877` | a crowd of workers facing a line of soldiers on an iron viaduct over rail yards |
| `1882` | immigrant families with bundles and trunks stepping off a train, a cable car passing behind |
| `1889` | a brick mansion with an open door and children on the steps, a saloon on the corner across the street |
| `1893` | a gleaming white domed exposition and a giant Ferris wheel in the distance, dark crowded tenements in the foreground |
| `1900` | a crowded street of tenements at dawn with one small new park of trees in the middle |

## Landmark hero shots (14 images)

When a landmark goes up, the camera flies to it and a card explains it. A hero shot fills the top of that card. Aspect ratio **16:9**. Save into `art/raw/landmarks/`.

Template: *"A dramatic low-angle view of [landmark], Chicago, [year], with small period figures and horse-drawn wagons at its base for scale. Golden late-afternoon light."* then the style block. For real buildings, attach a period photograph or engraving as a reference so the architecture is right.

| File name | Landmark |
| --- | --- |
| `elevators` | tall wooden grain elevators on a river, a lake schooner loading alongside, 1848 |
| `courthouse` | the domed stone Chicago courthouse of the 1850s with a bell tower |
| `stockyards` | the limestone gate of the Union Stock Yards with cattle pens stretching to the horizon, 1865 |
| `watertower` | the Chicago Water Tower, a castle-like limestone tower with turrets, 1869 |
| `homeinsurance` | the ten-story Home Insurance Building, an early skyscraper, 1885 |
| `dearborn` | Dearborn Station, a red brick railroad terminal with a tall clock tower, 1885 |
| `auditorium` | the Auditorium Building, a massive granite block with a square tower, 1889 |
| `masonic` | the Masonic Temple, a twenty-story tower with a steep gabled roof, 1892 |
| `ferris` | the giant Ferris wheel of the 1893 World's Fair above white exposition buildings |
| `elevator` | a single wooden grain elevator beside railroad tracks in a neighborhood of small cottages |
| `stpatricks` | St. Patrick's Church, cream brick with two front towers, Irish families on the steps, 1856 |
| `maxwell` | Maxwell Street market crowded with pushcarts, awnings, and shoppers, 1880s |
| `powers` | a corner saloon at night with warm light in the windows and men in derby hats at the door, 1889 |
| `hullhouse` | Hull House, a brick Italianate mansion with a white porch, children on the steps and tenements pressing in on both sides, 1890 |

## Title art (1 image)

Aspect ratio **16:9**. Save as `art/raw/ui/title`.

*"A wide view of Chicago around 1890 seen from the west at sunset: wooden cottages and brick tenements in the foreground, a river with schooners and swing bridges in the middle, tall early skyscrapers beyond, and the lake on the horizon. Empty sky across the top third."* then the style block.

## Order to work in

1. Bridget (the anchor), then the other 13 portraits. They change the game the most.
2. The 11 round banners.
3. The 29 icons. These are the fussiest: check each one at 32 pixels.
4. Title art.

## Not covered yet

Meter icons, a custom card frame, and the final report's masthead still use built-in styling. Say the word and slots for those get added the same way.
