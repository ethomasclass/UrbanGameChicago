# Art plan for The Urban Game: Chicago

Everything on screen today is drawn by code: emoji icons, CSS panels, and placeholder cameo portraits. This file lists what custom art would replace, in the order that gets the most effect for the least drawing, and how each piece plugs in.

## 1. Portraits (highest value)

Twelve characters speak in the game. Each needs one portrait.

| id | Who | Real person? | Notes |
| --- | --- | --- | --- |
| `pike` | Harlan Pike, mill owner | no | Speaks for industry in every era |
| `voss` | Dr. Ada Voss, physician | no | Speaks for public health |
| `crane` | Josiah Crane, landlord | no | Speaks for rent |
| `doyle` | Marshal Doyle, fire marshal | no | |
| `whitlow` | Miss Whitlow, schoolteacher | no | |
| `lund` | Captain Lund, lumber shipper | no | |
| `beck` | Mr. Beck, garment contractor | no | |
| `dunne` | Father Dunne, St. Patrick's | yes | |
| `addams` | Jane Addams | yes | Many public-domain photographs exist for reference |
| `powers` | Alderman Johnny Powers | yes | |
| `bridget` | Bridget Malone | no | Also the face of the Malone family stories. Ages from about 25 (1848) to 77 (1900) |
| `rosa` | Rosa Rossi | no | Also the face of the Rossi family stories |

**How to add one:** see `docs/FLOW.md`, which has the prompt and file name for every asset and the one command that installs them.

**Spec:** portrait orientation, 5:6 (for example 400 by 480 pixels), transparent or plain background. They display at about 46 by 55 pixels in the advice card and could go larger on the history cards, so faces need to read at thumbnail size: strong silhouette, simple shapes, one identifying prop or hat each.

**Later options:** two or three ages for Bridget, a second expression per character (pleased, grim) chosen by how the ward is doing, and portraits for the Malone and Rossi children.

## Direction chosen (November 2026): flat-color illustrated portraits

Reference: a three-quarter bust built from flat planes of color with no outlines, on cream, in deep teal and navy with one warm orange accent, and a dry-brush or spatter texture where the figure fades out at the bottom.

Rules that keep twelve portraits looking like one set:

- **Palette:** cream ground (`#f1e7cf`, already the game's paper color), deep teal and navy for clothing and shadow, one warm accent per character (hair, shawl, hat band, waistcoat). No other hues.
- **Shading:** two or three flat tones per surface, hard edges, light always from the upper left.
- **Crop:** head and shoulders, turned three-quarters, eyes on the upper third. Same head size in every portrait.
- **Period comes from costume:** hats, collars, shawls, hair. This is what tells a student it is 1855 and not today, so each character gets one unmistakable silhouette piece.
- **Edges:** transparent background; the spatter fade at the bottom is fine, nothing behind the head.
- **Legibility:** must still read at 72 pixels wide. Check every portrait at that size before calling it done.
- **Real people** (Addams, Powers, Dunne) are drawn from period photographs. Invented characters are free.

## 2. Other looks considered

Pick one before drawing anything, because the portraits set it. Three directions that fit the period and print well:

- **Woodcut / newspaper engraving.** Black line on cream, one spot color. Matches Gilded Age papers and the Riis photographs, cheapest to keep consistent, and legible when small.
- **Cut-paper / flat color.** Matches the blocky 3D buildings and the paper-diorama feel of the original hand-drawn game.
- **Hull-House map colors.** Borrow the palette of the 1895 nationality maps for the whole interface.

## 3. Interface pieces

| Piece | Replaces | File (proposed) | Size |
| --- | --- | --- | --- |
| Build icons, about 30 | Emoji in the build card and history card | `assets/icons/<kind>.svg` | 64 by 64, one color plus accent |
| Card frame | Plain cream panel with red top bar | `assets/ui/card.svg` or a 9-slice PNG | scalable |
| Title art | Text-only start screen | `assets/ui/title.png` | about 1200 by 500 |
| Meter icons, 4 | Text labels (People, Health, Happiness, Have work) | `assets/icons/meter-*.svg` | 32 by 32 |
| Round header vignettes, 11 | Nothing yet | `assets/rounds/<year>.png` | about 560 by 160, one small scene per round |
| Family name tags | Text labels over the Malone and Rossi homes | drawn in code from the portrait | n/a |
| Report masthead | Text heading | `assets/ui/report.png` | about 1600 by 300 |

The icons matter most after portraits: emoji look different on every device and some (the reform tenement, the gas works) have no good match.

## 4. The 3D city

Buildings are built from colored boxes with two small textures (walls and roofs), and the ground from six painted tiles. If hand-painted textures are wanted later:

- `assets/tex/wall-wood.png`, `wall-brick.png`, `roof.png`: 128 by 128, tileable, drawn light so the game can tint them.
- `assets/tex/ground-*.png`: prairie, mud, plank road, granite block, yard dirt, ash. 128 by 128, tileable.
- Signs for unique buildings (Powers's saloon, Maxwell Street, Hull House): small PNGs applied to one face.

## 5. Sound

All sound is synthesized. A fire bell, a train whistle, a streetcar gong, and crowd noise would each be one short file in `assets/sound/`.

## Open questions

1. Who draws: you, students, or generated art that you then correct? Student-drawn portraits of the cast could be a project of its own.
2. Real people: photographs of Addams and Powers exist. Portraits of them should look like them; the invented characters are free.
3. Which look from section 2?
