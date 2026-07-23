# PropChamps Cases — Leonardo.ai workflow

Two stages. **Generate one master crate first**, get it perfect, then use that image
as the reference for all three tiers. Don't try to make the three tiers directly from
text — they will not match, and mismatched camera angles across the row is the one
thing that will make the page look broken.

---

# ⭐ HERO PROMPT — the premium look (use this)

The earlier master is a flat studio render — evenly lit, so it goes murky small on
the page. Premium reads as **dramatic**: one light source, deep shadows, the case
emerging from black with the seam as the glowing focal point. This prompt is tuned
for that. Generate the master with it, then run Stage 2 as normal off the winner.

### Prompt

```
Dramatic hero product render of a sealed matte black hard-shell equipment case,
emerging from deep darkness. Three-quarter view from slightly above, the front
face and right side both visible. Injection-moulded composite shell with fine
micro-texture, machined aluminium corner blocks, two heavy latches, a large empty
recessed panel on the front. A single brilliant light line glows along the seam
where the lid meets the body — the brightest thing in the frame — casting a soft
glow onto the panels around it. Lit by one dramatic rim light from the upper left
carving the top edge out of the black, everything else falling into deep shadow.
Cinematic, high contrast, moody, expensive, like a luxury watch advertisement.
Photorealistic 3D render, Keyshot, octane, 85mm lens, shallow depth of field,
razor-sharp detail on the lit edges, centred, isolated on pure black, no
background, no floor, no text.
```

### Negative prompt

```
flat lighting, evenly lit, studio softbox, bright, low contrast, washed out, text,
letters, logo, watermark, background, floor, ground shadow, scene, multiple
objects, treasure chest, wooden crate, toolbox, wheels, handle, cartoon,
illustration, flat vector, blurry
```

Judge it the same way as before (three faces, one clean seam line, machined
corners) **plus**: it should look like it's lit by one light in a dark room, with
the seam clearly the brightest point. If it looks flat and evenly bright, reject it
— that flatness is exactly what read cheap on the page.

---

# STAGE 1 — the master crate

Text-to-image, no reference. You are making **one** neutral crate that everything
else is cloned from. Spend your generations here; this is the asset that matters.

### Prompt

```
Studio product photograph of a sealed matte graphite hard-shell equipment case,
three-quarter view from slightly above so the top face, the front face and the
right side face are all clearly visible. Injection-moulded composite shell with
fine surface texture, machined aluminium trim, two heavy spring latches on the
front straddling the seam where the lid meets the body, reinforced metal corner
brackets, a recessed rectangular badge plate centred on the front, narrow vent
slots either side of it, a recessed carry handle on the right side, low rubber
feet. Neutral desaturated gunmetal and graphite. Lit like high-end audio
equipment: large softbox key light from the upper left, cool rim light raking the
right edge, deep controlled falloff. Photorealistic 3D product render, Keyshot,
octane, 85mm lens, razor sharp micro-detail, centred, isolated object on pure
black, no background, no floor.
```

### Negative prompt

```
text, letters, words, numbers, logo, branding, watermark, signature, background,
scenery, room, floor, table, ground shadow, multiple objects, treasure chest,
wooden crate, pirate chest, toolbox, rolling suitcase, cartoon, illustration,
flat vector, low poly, blurry, soft focus, oversaturated, colourful, gold, neon,
glowing
```

Note it excludes **gold, colourful, glowing** on purpose. The master stays neutral
so the tier colours don't fight it later.

### Settings

- Model: **Auto**. This is not optional — image reference is only available on Auto,
  so Stage 2 cannot run on any other model.
- Style: **None** (or **Dynamic**). The prompt already specifies the render look in
  words, so it does not need a preset.
  **Never `Cinematic`** — it runs on the PhotoReal pipeline, which cannot take an
  image reference. It works fine in Stage 1 and returns "Validation failed. Please
  check your request parameters." the moment you attach the master in Stage 2.
- Alchemy **on** · Guidance **7** · Aspect **1:1** · at least **1024×1024**
- Generate 4 at a time

### How to pick the winner

Reject anything where the camera is wrong even if it looks nice — angle is the whole
job. Keep the one where:

- You can clearly see **three faces** (top, front, right side). If you only see the
  front, throw it out.
- The **lid seam is one clean straight line** across the front and continues onto the
  side face.
- The **two latches are level with each other** and sit on the seam.
- **Corners look machined**, not melted or smeared.
- It reads **grey**, not brown, beige or blue.

Save the winner. Everything below uses it.

---

# STAGE 2 — the three tiers

Now upload the master into **Image Guidance** and run these three. Same reference
image every time, so the shape and camera stay locked and only the finish changes.

**Leonardo settings for this stage**

- Image Guidance → upload master → type **Content Reference**, strength **0.55**
- If a tier drifts off-shape, raise to **0.7**. If they all look identical grey and
  ignore the colour, drop to **0.4**.
- Everything else identical to Stage 1. Same negative prompt **except remove
  `gold`, `colourful`, `glowing`** — you want those now.
- **Model stays on Auto** (required for the reference) and **Style stays off
  Cinematic**. If you still hit "Validation failed", drop Style to `None` and turn
  **Alchemy off**.
- Because Auto picks the model per request, it can drift between generations.
  **Run all three tiers back-to-back in one session.** If they come back looking like
  different materials rather than the same case in different finishes, raise Content
  Reference to **0.7**.

### Starter — steel

```
The same hard-shell equipment case, identical shape, identical camera angle.
Finish is brushed gunmetal and cold anodised steel, machined aluminium latches and
corner brackets. A thin cold steel-blue light line glows along the seam where the
lid meets the body. Understated, industrial, expensive. Photorealistic 3D product
render, isolated on pure black, no background.
```

### Pro — violet

```
The same hard-shell equipment case, identical shape, identical camera angle.
Finish is dark charcoal composite with machined violet-anodised metal trim, violet
latches and corner brackets. Violet light glows out of the seam where the lid
meets the body and traces thin channels along the panel edges. Premium and
aggressive. Photorealistic 3D product render, isolated on pure black, no
background.
```

### Elite — gold

```
The same hard-shell equipment case, identical shape, identical camera angle.
Finish is black obsidian composite with polished gold machined trim, gold latches
and gold reinforced corner brackets, fine engraved detailing. Warm amber light
pours out of the seam where the lid meets the body. Luxury vault, heavy and
expensive, restrained not gaudy. Photorealistic 3D product render, isolated on
pure black, no background.
```

---

# STAGE 3 — open versions (optional, big payoff)

Right now the closed crate scales and fades at the moment it opens. With these I cut
to a real open crate instead, which is a much better beat.

Use **the same master as reference**, same settings, and take each tier prompt above
and append:

```
The case is open. The lid is lifted and tilted back on its hinges, brilliant
white-hot light pouring upward out of the interior, the inside lost in the glare,
fine embers rising. Identical camera angle, identical materials, identical
lighting direction to the closed version.
```

---

# Delivering the files

Drop them in this folder with these **exact names** and the page picks them up
automatically — no code change, and anything missing falls back to the built-in SVG.

| Filename | What it is |
|---|---|
| `starter.png` | Starter crate, closed |
| `pro.png` | Pro crate, closed |
| `elite.png` | Elite crate, closed |
| `starter-open.png` | Starter crate, lid open (optional) |
| `pro-open.png` | Pro crate, lid open (optional) |
| `elite-open.png` | Elite crate, lid open (optional) |

**Three rules on the files themselves**, which matter more than the render quality:

1. **Transparent background, or pure black I can knock out.** The page draws its own
   glow, floor line and reflection behind the crate — a baked-in background will sit
   on top of all three and look pasted on.
2. **No baked ground shadow.** Same reason. The crate should float on nothing.
3. **Don't crop them differently.** Whatever framing you use, use it on all three, or
   one crate will sit higher than the others in the row.

Send them at whatever size Leonardo gives you. I'll crop, compress and wire them in.

---

## Also in this folder

`reference-crate.svg` / `reference-crate.png` — the flat diagram I drew. **Not** for
use as a style reference (it's vector, and Leonardo would copy that flatness into
your renders). It's only useful as a *composition guide* — look at it to see the
camera angle and feature placement I built the page layout around. If Stage 1 refuses
to give you the right angle from text alone, you can load it as an **Edge or Depth
ControlNet at low strength (~0.3)** purely to force the geometry, with a photoreal
prompt doing all the styling.
