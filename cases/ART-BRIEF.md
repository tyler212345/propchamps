# PropChamps Cases — art brief (Leonardo.ai)

Drop finished files in this folder with these **exact names** and the page picks them
up automatically. No code change needed.

| File | Used for |
|---|---|
| `/cases/starter.png` | Starter tier — page tile + opening animation |
| `/cases/pro.png` | Pro tier — page tile + opening animation |
| `/cases/elite.png` | Elite tier — page tile + opening animation |

If a file is missing the page silently falls back to the crown logo, so you can add
them one at a time.

---

## Hard requirements (these matter more than the prompt)

- **Transparent background (PNG with alpha).** In Leonardo, either use the
  *Transparency* toggle, or generate on pure black `#000000` and background-remove
  after. The page puts its own glow and shadow behind the object — a baked-in
  background or shadow will look wrong.
- **Square, 1:1**, min **1024×1024**. Bigger is fine, I'll compress.
- **Object centred**, roughly 80% of the frame, with a little breathing room. It gets
  a drop shadow and a coloured halo added in CSS.
- **Three-quarter view, slightly above** — the object should read as sitting in space,
  not a flat front-on icon.
- **Keep all three consistent.** Same camera angle, same lighting direction, same
  material language. Only the colour and the ornamentation should change between
  tiers. Generate all three in one session so the style holds.
- **Under ~400KB each** after export. Tell me if they're bigger and I'll optimise.

---

## The brand

- Background of the site is near-black `#0a0d12`
- Signature colour is acid lime `#c8ff00`
- Tier colours: Starter **steel grey `#8b98a8`**, Pro **violet `#7c5cff`**, Elite **gold `#ffb020`**
- The mark is a crown (see `/logos/propchamps-crown.png`) — worth working in, but
  don't let Leonardo try to render the wordmark. AI text always comes out mangled.
  **Leave lettering off entirely**; I can overlay real type in code if we want it.

---

## Prompt 1 — Starter Case

```
A sealed futuristic loot crate floating against pure black, three-quarter view from
slightly above. Brushed gunmetal and dark steel panels with visible seams and
recessed rivets, industrial hard-surface design. A thin steel-grey light seam runs
around the middle of the crate where the lid meets the body, emitting a soft cold
glow. Small embossed crown emblem centred on the front panel, subtle and metallic,
no text. Cinematic rim lighting from the upper left, cool grey key light, deep
shadows. Photorealistic 3D product render, octane render, ultra sharp, high detail,
centred composition, isolated object, transparent background.
```

**Negative prompt**
```
text, letters, words, logo type, watermark, signature, background, floor, table,
scene, clutter, multiple objects, blurry, low detail, cartoon, flat illustration,
drop shadow, reflection on ground
```

---

## Prompt 2 — Pro Case

```
A sealed futuristic loot crate floating against pure black, three-quarter view from
slightly above. Dark charcoal armoured panels with glowing violet energy channels
running through the seams and along the edges, purple #7c5cff internal light bleeding
from the gaps. Faceted angular hard-surface design, premium and aggressive. Small
embossed crown emblem centred on the front panel catching violet light, no text.
Cinematic rim lighting, violet key light from the upper left, volumetric glow.
Photorealistic 3D product render, octane render, ultra sharp, high detail, centred
composition, isolated object, transparent background.
```

**Negative prompt** — same as above.

---

## Prompt 3 — Elite Case

```
A sealed futuristic loot crate floating against pure black, three-quarter view from
slightly above. Black obsidian panels trimmed in polished gold, glowing amber #ffb020
light escaping from the seam where the lid meets the body, ornate but restrained
metalwork on the corners. Luxury vault aesthetic, heavy and expensive looking. Small
raised gold crown emblem centred on the front panel, no text. Cinematic rim lighting,
warm gold key light from the upper left, volumetric god rays from the seam.
Photorealistic 3D product render, octane render, ultra sharp, high detail, centred
composition, isolated object, transparent background.
```

**Negative prompt** — same as above.

---

## Optional extras

**Open/burst variant** (nice-to-have, not required). If you generate an *open* version
of each crate — same object, lid off, light pouring out — name them
`starter-open.png` / `pro-open.png` / `elite-open.png` and I'll cut to it at the
moment the case bursts, which will look far better than scaling the closed one.

```
Same crate, now open. Lid lifted and tilted, brilliant white-hot light pouring
upward out of the interior, interior geometry lost in the glare, energy particles
rising. Same camera angle, same materials, same lighting direction. Photorealistic
3D render, isolated object, transparent background.
```

---

## Settings that work well in Leonardo

- Model: **Leonardo Phoenix** or **Leonardo Lightning XL**
- Preset style: **3D Render** or **Cinematic**
- Alchemy: **on**
- Guidance scale: **7**
- Aspect ratio: **1:1**
- Generate 4 at a time, pick the one where the seam glow reads clearly and the
  crown isn't distorted

If the crown keeps coming out wrong, drop the crown line from the prompt entirely.
A clean unbranded crate is better than a mangled emblem — I can composite the real
crown on top in code.
