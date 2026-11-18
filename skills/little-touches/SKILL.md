---
name: little-touches
description: "Add small, organic details to an interface: things that travel instead of being replaced, morphing icons and labels, digits and commas that move, context-aware explainers, edge states that still feel cared for, and rare moments of delight placed where they matter. Use when asked to make a product feel alive, delightful, crafted, or fluid, to add micro-interactions or easter eggs, or to find where small details would help. Distilled from Benji Taylor's posts and essays on product craft. Prefer interface-polish for hierarchy and layout fixes and a motion skill for animation architecture."
---

# Little touches

A little touch is a small decision that makes the product feel looked after. Done well, people don't notice the detail. They notice that the app feels calm, clear, and alive. Benji Taylor puts it this way: polish is "the accumulated effect of caring about every small thing until the small things stop calling attention to themselves."

Work from the product as it is. Keep its type, icons, colours, and motion system, and add touches that fit them. Each one should help someone follow what changed, trust what happened, or enjoy a rare moment. Don't add motion to make a screen busier.

## Find the moments before choosing effects

Walk a real task from start to finish and note every point where something changes: a value is entered, a screen is replaced, a request starts and finishes, a list goes empty, a label switches, a tab changes. Each change is a candidate. Then sort the candidates by how often people reach them.

- **Daily paths** (sending, typing, navigating tabs, opening media): keep them fast and light. A good touch here is continuity, such as a comma sliding into place or a word changing while the rest of the sentence holds still. Never make someone wait for it.
- **Occasional moments** (creating an account, activating a card, finishing a backup, deleting something): these can carry more character, such as an interactive tutorial, a short sound, or confetti.
- **Hidden places** (the QR code, an empty state, typing more than the balance): leave something for curious people to find. It must never block the task.

This is Benji's delight–impact curve: the rarer the moment, the more delight it can carry. He turned down a shared-element transition on a sidebar avatar because that screen is "opened hundreds of millions of times a day" and it "would quickly feel overkill". Frequency decides the size of a touch more than taste does.

## Let things travel instead of being replaced

This is the most important rule. If something is still there on the next screen, move that same element. Don't swap in a copy. A static cut makes people check that nothing changed, and visible travel lets them see it.

- A value typed on one screen moves onto the confirm screen, so people can see it is the same amount.
- After submitting, the spinner moves into the tab or icon where the pending item will appear. It shows where to look next.
- When a sentence stays mostly the same between states ("Learn more about tokens" → "Learn more about NFTs"), keep the shared text still and animate only the word that changes.
- When a button label changes meaning ("Continue" → "Confirm"), morph through the letters both words share so people notice the change.
- Close and back are one icon. In a multi-step sheet, the X becomes a chevron after the first step.
- Tabs move toward the side that was tapped. As Benji says, "we fly instead of teleport."
- Media opens from its thumbnail and closes back into it, whether it is an image, a video, or an avatar.

Never duplicate something that is already on screen just to animate it. Benji calls that a pet peeve. If a component stays across a transition, it stays one element.

## Reveal complexity only when it becomes relevant

Keep most screens quiet. Show the next piece of UI, an explanation, or a confirmation when it is needed, in place, without sending people somewhere else.

- Use trays or sheets for short tasks: one piece of content or one main action per tray. Give each step in a sequence a different height so the change is visible. A tray can grow into a full screen when the task grows.
- Teach inline: action, then tutorial, then action. End the tutorial on a frame that matches the real screen, so the lesson turns into the feature.
- Make explainers about what people are already looking at. Use their actual post, balance, or file, not a generic example.
- Keep colour consistent along a path, so people can tell which branch they are on as each step moves forward in depth.

## Morph shapes, don't crossfade them

A crossfade reads as one thing disappearing and another appearing. A morph reads as one thing changing. Use morphs for icons with several states (play/pause, menu/close, plus/cross, arrow/check), status marks, and mascots.

Build an icon family from the same small set of primitives, such as three SVG lines. Collapse unused primitives to an invisible point at the centre. Rotate shapes that differ only by direction (arrows, chevrons, plus versus cross at 45°) instead of interpolating their coordinates, because interpolated coordinates bend and warp halfway through. Watch every pair. Some midpoints look awkward and need a different route. The [recipes](references/recipes.md) include working code.

## Treat edge states as places people visit

Loading, empty, paused, error, and partial-data states are screens people actually see. Design them, and animate between them the same way you animate between filled states. A chart with less than a year of data should still animate when someone taps 1Y, then explain what's missing. An empty browser can point at the button that fixes it. Apply the shared-text rule to empty states too.

Keep existing content during a refresh when it is still valid. Show the full image instead of a crop when space allows.

## Use every sense, and charge for misuse

Haptics and sound make the product feel physical. Tie them to the exact place and moment of the action: Honk sent a tap's coordinates and played the haptic at that same spot on the other phone. Keep sound for rare, satisfying completions, such as something tumbling into the trash. Frequent sounds cost attention. Benji calls the Slack notification sound "a total productivity killer". Respect the system's mute and haptic settings.

Friction can be a touch too. Apple made iMessage's "Notify Anyway" deliberately awkward, so people think before overriding a Focus mode. Make a costly or rude action feel slightly heavy, without hiding it.

## Make it in code, and make it watchable

Build touches in the real UI, not as a video layered on top. Animate each element on its own so you can reach it later. Make motion easy to inspect: add a slow-motion toggle (0.5×) or a pause-and-scrub control in development, and step through the sequence frame by frame. Benji's experience with AI-written motion: the model "optimises for working, not feeling right". Watching the result, naming exactly what feels wrong, and iterating is the work.

Benji's hiring bar sums up the standard: "Pixel perfect UI, no static transitions, no weird animation bugs." A choppy recording or a touch that glitches on reversal does more harm than leaving the touch out.

## Keep it honest and accessible

- Motion has to explain something: what moved, what is pending, what changed, or what this screen is. If you can't say what it explains, cut it or move it to a rarer moment.
- Every touch survives interruption. Reverse from the current visible state, and stop an exiting element from accepting input.
- Under `prefers-reduced-motion`, reach the same end state without movement. Crossfades or instant changes are fine. Keep the meaning, such as the pending badge on the tab.
- Easter eggs never hide required information and never fire on the main action path.
- Never delay the underlying action until an animation finishes.

The [catalog](references/catalog.md) lists Benji's touches by category, each with a source link. Read it for ideas when you choose a touch. The [recipes](references/recipes.md) cover how to build travelling elements, shared-letter text morphs, moving commas, three-line icon morphs, directional tabs, stepped trays, and reduced motion on the web. [assets/demo.html](assets/demo.html) shows several of them running.

## Verify the feel, not just the frame

Run each touch at full speed and at 0.5×. Spam it, reverse it partway through, run it with reduced motion on, use it from the keyboard, and try it at a narrow width. Check it with real data: long words, a value that grows past 999, empty results. Report which touches you added and the moment each one serves. Separate checks you ran from ones you didn't.
