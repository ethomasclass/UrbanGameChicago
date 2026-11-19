# First test batch for Google Flow

Eight images that test every kind of asset before committing to the full list in `FLOW.md`. Paste the prompt below into Flow with the agent turned on. Image 1 is the style anchor: everything after it uses image 1 as its reference.

```
I am making art for an educational history game about Chicago from 1837 to 1900. Create 8 images as one consistent set. Make image 1 first. Then use image 1 as the style reference for images 2 through 8, so that all eight look like they were made by the same illustrator on the same day.

STYLE FOR EVERY IMAGE
Flat-color digital illustration with no outlines. Forms are built from clean, hard-edged planes of color, two or three tones per surface. Limited palette: a warm cream background, deep teal and navy for clothing and shadow, natural skin tones, and one warm orange or rust accent. Light comes from the upper left. Subtle paper grain. No text, no lettering, no numbers, no border, no frame, no watermark. Nothing modern: every detail must belong to the nineteenth century.

IMAGE 1 (the style anchor). Aspect ratio 3:4.
Waist-up portrait of Bridget Malone, an Irish immigrant woman of 25 in Chicago in 1848. She stands turned three-quarters toward the viewer, holding a wicker laundry basket against her hip. Auburn hair under a dark teal wool shawl, plain high-necked dress, sleeves pushed up. Her expression is tired but determined. The top of her head is near the top of the frame. Plain cream background with nothing behind her. The figure fades into dry-brush spatter at the bottom edge.

IMAGE 2. Aspect ratio 3:4. Same style as image 1, different person.
Waist-up portrait of Harlan Pike, a prosperous mill owner of 50 in Chicago in 1865. Heavy side whiskers, black silk top hat, dark frock coat, gold watch chain, thumbs hooked in his waistcoat pockets. Satisfied, appraising expression. Same framing, background, and bottom fade as image 1.

IMAGE 3. Aspect ratio 3:4. Same style as image 1, different person.
Waist-up portrait of Jane Addams at about age 30 in Chicago in 1889. Dark hair parted in the middle and drawn back, dark high-necked dress with a small pin at the collar, holding a ledger book against her chest. Serious, gentle expression. Same framing, background, and bottom fade as image 1.

IMAGE 4. Aspect ratio 1:1. Same style as image 1.
A game icon: a single small one-story wooden workers' cottage from the 1850s with a gable roof and a front step, centered, seen from a slight three-quarter angle from above, filling most of the frame. Simple bold shapes that still read when tiny. Perfectly flat plain cream background with no ground shadow, no texture, and nothing else in the image.

IMAGE 5. Aspect ratio 1:1. Same style as image 1.
A game icon: a single brick factory with a sawtooth roof and one tall chimney trailing smoke, centered, seen from a slight three-quarter angle from above, filling most of the frame. Simple bold shapes that still read when tiny. Perfectly flat plain cream background with no ground shadow, no texture, and nothing else in the image.

IMAGE 6. Aspect ratio 16:9. Same style as image 1.
A wide landscape: flat wet prairie west of a river in 1837, a muddy wagon trail, one log cabin, a few surveyors' stakes with rags tied on, and a small frontier town on the far bank in the distance. Seen from far away with tiny figures and a strong horizon line. Keep everything important in the middle third of the height; the top and bottom should be empty sky and grass.

IMAGE 7. Aspect ratio 16:9. Same style as image 1.
A dramatic low-angle view of Hull House in Chicago in 1890: a two-story brick Italianate mansion with a white columned porch and a cupola, its front door open, immigrant children sitting on the steps, and crowded brick tenements pressing in on both sides. Golden late-afternoon light.

IMAGE 8. Aspect ratio 16:9. Same style as image 1.
A dramatic low-angle view of the Chicago Water Tower in 1869: a castle-like tower of pale yellow limestone with small turrets, standing over a dirt street with horse-drawn wagons and a few pedestrians for scale. Golden late-afternoon light.

Before finishing, compare images 2 through 8 against image 1. If any of them has outlines, photographic shading, extra colors outside the palette, or any lettering, redo that image.
```

## Save them as

| Image | Save as | In folder |
| --- | --- | --- |
| 1 | `bridget` | `art/raw/portraits/` |
| 2 | `pike` | `art/raw/portraits/` |
| 3 | `addams` | `art/raw/portraits/` |
| 4 | `cottage` | `art/raw/icons/` |
| 5 | `factory` | `art/raw/icons/` |
| 6 | `1837` | `art/raw/rounds/` |
| 7 | `hullhouse` | `art/raw/landmarks/` |
| 8 | `watertower` | `art/raw/landmarks/` |

Then run `python3 tools/art.py`, or send the files to Claude.

## What to look for

- Do the three portraits look like one set? Same head size, same light, same number of tones?
- Do the two icons still read at the size of a fingernail?
- Did the icon backgrounds come out perfectly plain? If not, the automatic cutout will leave a halo.
- Does Jane Addams look like Jane Addams? If not, attach a period photograph of her to that prompt and redo it.
- Is there any lettering anywhere? Reject it.
