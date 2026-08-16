# Counting Interaction Rules

These rules are mandatory whenever objects are counted anywhere in Chrys's Adventures. They apply to every mode, lesson, worked example, practice question, answer review, and solution animation.

## Required interaction

Every object-counting activity must include all of the following:

1. A visible button that starts the count. Do not begin counting automatically.
2. A visible number label above every object being counted.
3. Spoken number audio and visual highlighting that advance together.
4. A yellow highlight on only the object currently being counted.
5. A blue outline and blue number label on every object counted previously.
6. A faded appearance for objects that have not been counted yet.

## Count button behaviour

- Before counting, use a clear label such as **Start counting** or **Count the objects**.
- One button press must count the entire intended group from the first object to the last object. Do not require one press for each individual object.
- While counting, disable the button and show **Counting...**.
- After counting finishes, change the label to **Count again** when replay is appropriate.
- Replaying must reset the visual count and audio to the first object.
- Leaving the page must stop the active count and audio immediately.

## Audio and visual synchronization

- Use `speakCountingSequence` with its `onCount` callback for object counting.
- Update the highlighted object from the same `onCount` callback that plays the number audio.
- Never run a separate visual timer that can drift away from the spoken count.
- The spoken number and the yellow highlight must refer to the same object at the same time.
- Preserve the synchronized visual sequence when audio is muted by using the established silent-count fallback.
- After the final number audio and its yellow highlight finish, wait 500 milliseconds before revealing any total, result label, or completed-count state.
- Never reveal a total on the same frame as the final counted object.

## Object states

### Currently counted object

- Use a yellow border or outline.
- Use a yellow outer ring and a visible yellow glow.
- Use a yellow number badge above the object.
- Keep the object itself clear and unobscured.
- Highlight only the individual object, never its tray, basket, box, row, or surrounding panel.

### Previously counted objects

- Use a blue or cyan outline.
- Use a blue number badge above each object.
- Keep the object fully visible.
- Do not leave a yellow highlight on previously counted objects.

### Not-yet-counted objects

- Keep them faded or partially transparent.
- Their positions must remain visible so the child can see how many objects are waiting.
- If number labels are displayed before counting begins, use a muted neutral colour until each object is counted.

## Layout requirements

- Keep safe inner padding around every object group, including before counting starts. No object may touch a tray, basket, box, or panel edge.
- Reserve enough room for the active object's scale, yellow ring, glow, and number badge when deciding that padding.
- Leave enough space between objects for the yellow ring and number badge.
- The active highlight must not overlap neighbouring objects or cross the container boundary.
- Increase the container size or split objects into centred rows when necessary.
- Keep the final row centred when it contains fewer objects.
- Never allow counted objects, number labels, or highlight rings to collide.

## Completion checklist

Before completing any counting-related change, verify:

- [ ] Counting begins only after a button press.
- [ ] Every object has the correct number label.
- [ ] Audio and visual counting advance together.
- [ ] Every total appears 500 milliseconds after the final counted object and audio finish.
- [ ] Exactly one object is yellow during the count.
- [ ] Earlier objects have blue outlines and blue labels.
- [ ] Future objects remain faded.
- [ ] Highlight rings and labels do not overlap or leave their container.
- [ ] Count replay resets both audio and visuals.
- [ ] Navigating away stops the count.
