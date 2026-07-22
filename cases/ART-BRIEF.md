# PropChamps Cases — Leonardo.ai prompt pack

Generate these, drop them in this folder with the **exact filenames**, and the page
picks them up automatically. No code changes. Anything missing falls back to the
built-in SVG, so you can add them one at a time.

| Filename | What it replaces | Size |
|---|---|---|
| `starter.png` | Starter crate — card + opening animation | 1024×1024 |
| `pro.png` | Pro crate | 1024×1024 |
| `elite.png` | Elite crate | 1024×1024 |
| `starter-open.png` | Starter crate, lid off (optional, big win) | 1024×1024 |
| `pro-open.png` | Pro crate, lid off | 1024×1024 |
| `elite-open.png` | Elite crate, lid off | 1024×1024 |

---

## Read this before you generate anything

These five rules matter more than the prompt wording. Ignore them and the renders
will look worse than what's on the page now.

1. **Transparent background.** Leonardo's *Transparency* toggle, or generate on
   pure black and background-remove. The page supplies its own glow, floor and
   reflection — a baked-in background will fight all three and look pasted on.
2. **No baked shadow.** Same reason. The crate should float on nothing.
3. **Identical camera on all three.** Generate them in one session, same seed
   family, same angle. If Starter is shot from 20° above and Elite from 40°, the
   row looks broken. **Three-quarter view from slightly above** — you should see
   the top face, the front face and one side face.
4. **No lettering.** AI text always comes out mangled and it will be the first
   thing anyone notices. Leave words off; I overlay real type in code.
5. **Object fills ~85% of the frame, centred**, a little air around it.

---

## The look we're going for

Not a treasure chest. Not a game loot box with cartoon gold. **A sealed hard-shell
equipment case** — think a Pelican flight case or a military ammo crate crossed with
high-end audio gear. Expensive, industrial, understated. The tier colour should read
as *lighting and trim*, not as the body colour.

- Site background is near-black `#0a0d12`
- Starter = steel grey `#8b98a8` · Pro = violet `#7c5cff` · Elite = gold `#ffb020`

---

## Prompt 1 — Starter

```
A sealed hard-shell equipment case floating in empty black space, three-quarter
view from slightly above showing the top face, front face and right side. Brushed
gunmetal and dark anodised steel panels, recessed latches, reinforced corner
brackets, fine panel seams and hex bolts. A thin cold steel-blue light line glows
along the seam where the lid meets the body. Industrial hard-surface product
design, understated and expensive, like a Pelican flight case. Cinematic studio
lighting, cool key light from the upper left, soft rim light on the right edge,
deep controlled shadows. Photorealistic 3D product render, octane, ultra sharp,
high micro-detail, centred, isolated object, transparent background.
```

## Prompt 2 — Pro

```
A sealed hard-shell equipment case floating in empty black space, three-quarter
view from slightly above showing the top face, front face and right side. Dark
charcoal composite panels with machined violet metal trim, recessed latches and
reinforced corner brackets. Violet #7c5cff light glows out of the seam where the
lid meets the body and traces thin channels along the panel edges. Industrial
hard-surface product design, premium and aggressive. Cinematic studio lighting,
violet key light from the upper left, soft rim light, volumetric glow, deep
controlled shadows. Photorealistic 3D product render, octane, ultra sharp, high
micro-detail, centred, isolated object, transparent background.
```

## Prompt 3 — Elite

```
A sealed hard-shell equipment case floating in empty black space, three-quarter
view from slightly above showing the top face, front face and right side. Black
obsidian composite panels with polished gold machined trim, gold latches and
reinforced gold corner brackets, fine engraved detailing. Warm amber #ffb020 light
pours out of the seam where the lid meets the body. Luxury vault aesthetic, heavy
and expensive, restrained not gaudy. Cinematic studio lighting, warm gold key light
from the upper left, soft rim light, volumetric glow, deep controlled shadows.
Photorealistic 3D product render, octane, ultra sharp, high micro-detail, centred,
isolated object, transparent background.
```

## Negative prompt — use on all three

```
text, letters, words, numbers, logo, typography, watermark, signature, background,
floor, ground, table, shadow on ground, scene, environment, clutter, multiple
objects, treasure chest, wooden crate, cartoon, illustration, flat vector, low
detail, blurry, oversaturated, gaudy, cheap plastic
```

---

## Prompts 4–6 — the open versions

Worth doing. Right now the closed crate scales and fades at the burst moment; with
these I cut to the open crate instead, which is a far better moment.

Take **the exact same prompt** as the matching closed crate and append:

```
The case is open. The lid is lifted and tilted back, brilliant white-hot light
pouring upward out of the interior, the inside lost in the glare, fine embers and
light particles rising. Identical camera angle, identical materials, identical
lighting direction to the closed version.
```

Keep the same negative prompt.

---

## Leonardo settings

- Model: **Leonardo Phoenix** (or Lightning XL if Phoenix fights you)
- Preset: **3D Render** or **Cinematic**
- Alchemy **on**, Guidance **7**, aspect **1:1**
- Generate 4 per prompt and pick the one where the **seam light reads clearly** and
  the corners look machined rather than melted

Send them over at whatever size Leonardo gives you — I'll crop, compress and wire
them in. If a crate comes out great but the angle is off from the others, send it
anyway and say so; matching angle matters more than any single render.
