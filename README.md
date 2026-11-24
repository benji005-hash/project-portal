# Rockview ICT Portal

A two-page student portal prototype for the Department of Information & Communication Technology, built with HTML5, CSS3 and vanilla JavaScript. No build step, framework or server is needed.

> Concept preview. The Rockview crest and official campus imagery are used with a forest-green and academic-gold palette. The registration form does not send or store any data.

## How to run

Open `index.html` in Chrome, Edge or Firefox. Everything works from the file system; an internet connection is only needed to load the two Google Fonts (the site falls back to system fonts without it).

## Folder structure

```
rockview-ict-portal/
├── index.html          Page 1: Home / department information
├── register.html       Page 2: Student course registration
├── css/
│   └── styles.css      One shared stylesheet for both pages
├── js/
│   ├── script.js       Menu, back-to-top, scroll reveal (both pages)
│   └── validation.js   Form validation, progress, confirmation (register page)
├── images/             Photos and favicon
└── README.md
```

## Before you submit

These items are placeholders. Search the HTML for `TODO` to find each one.

| Item | Where | What to do |
| --- | --- | --- |
| Course codes, names and credits | `index.html`, courses table | Replace with the lecturer-approved list. Swap each "To be confirmed" pill for `<span class="course-credits">3</span>` |
| "Placeholder catalogue" notice | `index.html`, beside the table | Delete once the list is confirmed |
| Elective list | `register.html`, Step 4 | Confirm the electives with the lecturer |
| Contact details | Footer of both pages | Email and phone numbers are supplied; department office remains to be confirmed |

If you add or remove an elective, nothing else needs changing: the "x of 5 selected" counter reads the checkboxes on the page.

Submission ZIP name: `[YourStudentID_WebLab1].zip`

## Assignment requirements covered

| Requirement | Where |
| --- | --- |
| Two linked pages | `index.html` and `register.html`, linked through the header, footer, buttons and breadcrumb |
| Semantic HTML5 | `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `fieldset`, `legend` |
| Course table (code, name, credits) | `index.html`, section 6 |
| Text, email and student ID inputs | `register.html`, Step 1 |
| Dropdown including Third Year | `register.html`, Step 2 |
| Radio buttons (one shared name) | `register.html`, Step 3 |
| Checkboxes (multiple choice) | `register.html`, Step 4 |
| Textarea | `register.html`, Step 5 |
| Submit and Reset buttons | `register.html`, Actions |
| External stylesheet | `css/styles.css` |
| Responsive layout | Section 18 of `styles.css` (601px, 901px, 1201px) |

## How the form works

`validation.js` is built around one function, `render()`. Whenever a field changes, `render()` reads the values, checks them against the rules, and updates the error messages, the error summary, the elective and character counters, and the progress guide.

- An error appears once you have typed in a field and moved on, then updates as you type. Fields you never touched are only flagged when you submit.
- Submitting with problems lists them at the top of the form; each item links to its field.
- A valid submission replaces the form with a summary of what was entered.
- Reset Form asks for confirmation before clearing anything you have typed.
- Without JavaScript the form still validates, using the browser's built-in `required` and `type="email"` checks.

The form uses `method="post"`, the standard method for submitting form data, but there is no server endpoint. Do not describe the confirmation as a real registration.

## Accessibility

- Every field has a `<label>`; radio buttons and checkboxes are grouped with `<fieldset>` and `<legend>`.
- Errors use an icon and text, not colour alone, and are linked to their fields with `aria-describedby`.
- Everything can be reached and used with the keyboard, with a visible focus ring.
- Animations are switched off when the system "reduce motion" setting is on.

## Credits

- Fonts: Manrope and Inter (Google Fonts)
- Crest, graduation and campus photos: Rockview University (rockviewuniversity.ac)
- Coding image: AI-generated for this project
