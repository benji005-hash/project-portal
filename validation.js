/* ==========================================================================
   Rockview ICT Portal — registration form behaviour (register.html only)

   How it works
   Every time the visitor types, selects or leaves a field, render() runs.
   render() reads the current values from the form, checks them against the
   rules, and updates everything on the page that depends on them:

     - the error message under each field
     - the error summary at the top of the form
     - the "x of 5 selected" elective counter
     - the comments character counter
     - the progress bar and the steps in the registration guide

   There is no server in this prototype. A valid submission shows a
   confirmation panel; nothing is sent or stored anywhere.
   ========================================================================== */
(() => {
  "use strict";

  const form = document.getElementById("registration-form");
  if (!form) return;

  /* The HTML uses "required" and type="email", so the browser still validates
     the form if this script fails to load. When the script does run, it shows
     its own messages instead of the browser's pop-up bubbles. */
  form.noValidate = true;

  /* ------------------------------------------------------------------------
     Elements
     ------------------------------------------------------------------------ */
  const formCard = document.getElementById("form-card");
  const successPanel = document.getElementById("registration-success");
  const summary = document.getElementById("error-summary");
  const summaryTitle = document.getElementById("error-summary-title");
  const summaryList = document.getElementById("error-summary-list");
  const electiveCount = document.getElementById("elective-count");
  const commentCount = document.getElementById("comments-count");
  const guideCount = document.getElementById("guide-count");
  const progress = document.getElementById("progress");
  const progressBar = document.getElementById("progress-bar");
  const steps = Array.from(document.querySelectorAll("#steps .step"));
  const dialog = document.getElementById("reset-dialog");
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  const trackInputs = Array.from(form.querySelectorAll('input[name="specialisation"]'));
  const electiveInputs = Array.from(form.querySelectorAll('input[name="electives"]'));

  /* ------------------------------------------------------------------------
     Rules
     Each rule returns a message, or an empty string when the value is valid.
     ------------------------------------------------------------------------ */
  const COMMENT_LIMIT = 500;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Student IDs are text: letters and leading zeros must be preserved
  const STUDENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/-]{3,19}$/;

  const rules = {
    fullName(values) {
      const value = values.fullName.trim();
      if (!value) return "Enter your full name.";
      if (value.length < 2) return "Your full name must be at least 2 characters.";
      if (/\d/.test(value)) return "Your full name should not contain numbers.";
      return "";
    },
    email(values) {
      const value = values.email.trim();
      if (!value) return "Enter your email address.";
      if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address, for example name@example.com.";
      return "";
    },
    studentId(values) {
      const value = values.studentId.trim();
      if (!value) return "Enter your student ID number.";
      if (!STUDENT_ID_PATTERN.test(value)) return "Use 4 to 20 letters and numbers. Hyphens and slashes are allowed.";
      return "";
    },
    academicYear(values) {
      return values.academicYear ? "" : "Select your academic year.";
    },
    specialisation(values) {
      return values.specialisation ? "" : "Select a specialisation track.";
    },
    electives(values) {
      return values.electives.length > 0 ? "" : "Select at least one elective course.";
    },
  };

  /* Validated fields in page order, with the control that should receive
     focus and the element that displays the error message. */
  const FIELDS = [
    { name: "fullName", focusId: "full-name", errorId: "full-name-error" },
    { name: "email", focusId: "email", errorId: "email-error" },
    { name: "studentId", focusId: "student-id", errorId: "student-id-error" },
    { name: "academicYear", focusId: "academic-year", errorId: "academic-year-error" },
    { name: "specialisation", focusId: "track-software-engineering", errorId: "track-error" },
    { name: "electives", focusId: "elective-advanced-web-development", errorId: "electives-error" },
  ];

  /* ------------------------------------------------------------------------
     State
     ------------------------------------------------------------------------ */
  const edited = new Set(); // fields the visitor has typed in
  const touched = new Set(); // fields whose error may now be shown
  let summaryRequested = false; // true after a submission with errors
  let submitted = false; // true while the confirmation panel is shown
  let resetConfirmed = false; // true while a confirmed reset is running
  let summarySignature = ""; // the errors currently listed in the summary
  let toastTimer;

  /* ------------------------------------------------------------------------
     Reading the form
     ------------------------------------------------------------------------ */
  function readValues() {
    const chosenTrack = trackInputs.find((input) => input.checked);
    return {
      fullName: form.elements.fullName.value,
      email: form.elements.email.value,
      studentId: form.elements.studentId.value,
      academicYear: form.elements.academicYear.value,
      semester: form.elements.semester.value,
      specialisation: chosenTrack ? chosenTrack.value : "",
      electives: electiveInputs.filter((input) => input.checked).map((input) => input.value),
      comments: form.elements.comments.value,
    };
  }

  function validate(values) {
    const errors = {};
    FIELDS.forEach(({ name }) => {
      const message = rules[name](values);
      if (message) errors[name] = message;
    });
    return errors;
  }

  function hasEntries(values) {
    return Boolean(
      values.fullName || values.email || values.studentId || values.academicYear || values.semester ||
        values.specialisation || values.electives.length || values.comments
    );
  }

  /** The visible text of a radio button or checkbox, taken from its label. */
  function labelOf(input) {
    const label = input.closest("label");
    const text = label.querySelector(".choice__title, .check__label");
    return text.textContent.trim();
  }

  /* ------------------------------------------------------------------------
     Updating the page
     ------------------------------------------------------------------------ */
  function showFieldError(field, message, isValid) {
    const errorElement = document.getElementById(field.errorId);
    errorElement.hidden = !message;
    errorElement.querySelector("span").textContent = message;

    // Text inputs and selects sit inside a .field wrapper that carries the state
    const control = document.getElementById(field.focusId);
    const wrapper = control.closest(".field");
    if (wrapper) {
      wrapper.classList.toggle("is-invalid", Boolean(message));
      wrapper.classList.toggle("is-valid", isValid && control.tagName === "INPUT");
      if (message) {
        control.setAttribute("aria-invalid", "true");
      } else {
        control.removeAttribute("aria-invalid");
      }
    }
  }

  function renderSummary(errors) {
    const visible = FIELDS.filter(({ name }) => touched.has(name) && errors[name]);
    summary.hidden = !(summaryRequested && visible.length > 0);

    // Only rebuild the list when the set of errors has actually changed
    const signature = visible.map((field) => errors[field.name]).join("|");
    if (signature === summarySignature) return;
    summarySignature = signature;

    summaryTitle.textContent = visible.length === 1 ? "Please check 1 field" : `Please check ${visible.length} fields`;
    summaryList.textContent = "";
    visible.forEach((field) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${field.focusId}`;
      link.textContent = errors[field.name];
      link.addEventListener("click", (event) => {
        event.preventDefault();
        moveTo(field.focusId, "center");
      });
      item.append(link);
      summaryList.append(item);
    });
  }

  function renderProgress(errors) {
    const done = [
      !errors.fullName && !errors.email && !errors.studentId,
      !errors.academicYear,
      !errors.specialisation,
      !errors.electives,
      submitted,
    ];
    const doneCount = done.filter(Boolean).length;

    steps.forEach((step, index) => {
      step.classList.toggle("is-complete", done[index]);
      step.querySelector(".step__state").textContent = done[index] ? "Complete" : "To do";
    });

    guideCount.textContent = `${doneCount} of ${steps.length}`;
    progressBar.style.width = `${(doneCount / steps.length) * 100}%`;
    progress.classList.toggle("is-done", doneCount === steps.length);
    progress.setAttribute("aria-valuenow", String(doneCount));
    progress.setAttribute("aria-valuetext", `${doneCount} of ${steps.length} steps complete`);
  }

  /** Recalculates everything from the current form values. */
  function render() {
    const values = readValues();
    const errors = validate(values);

    FIELDS.forEach((field) => {
      const message = touched.has(field.name) ? errors[field.name] || "" : "";
      showFieldError(field, message, !errors[field.name]);
    });

    renderSummary(errors);

    // Elective counter
    electiveCount.textContent = `${values.electives.length} of ${electiveInputs.length} selected`;
    electiveCount.classList.toggle("has-selection", values.electives.length > 0);

    // Character counter
    const length = values.comments.length;
    commentCount.textContent = `${length} / ${COMMENT_LIMIT}`;
    commentCount.classList.toggle("is-near", length >= COMMENT_LIMIT * 0.9 && length < COMMENT_LIMIT);
    commentCount.classList.toggle("is-full", length >= COMMENT_LIMIT);

    renderProgress(errors);
    return { values, errors };
  }

  /** Scrolls to an element and moves keyboard focus to it. */
  function moveTo(id, block) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ block });
    target.focus({ preventScroll: true });
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function showForm() {
    submitted = false;
    successPanel.hidden = true;
    formCard.hidden = false;
  }

  function showConfirmation(values) {
    const firstName = values.fullName.trim().split(/\s+/)[0];
    document.getElementById("success-name").textContent = firstName ? `, ${firstName}` : "";

    const chosenTrack = trackInputs.find((input) => input.checked);
    const summaryValues = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      studentId: values.studentId.trim(),
      academicYear: values.academicYear,
      semester: values.semester || "Not specified",
      specialisation: labelOf(chosenTrack),
      electives: electiveInputs
        .filter((input) => input.checked)
        .map(labelOf)
        .join(", "),
      comments: values.comments.trim() || "None provided",
    };
    // textContent (not innerHTML) so typed text is always shown as plain text
    successPanel.querySelectorAll("[data-summary]").forEach((cell) => {
      cell.textContent = summaryValues[cell.dataset.summary];
    });

    submitted = true;
    formCard.hidden = true;
    successPanel.hidden = false;
    render();
    moveTo("registration-success", "start");
  }

  function clearForm(message) {
    resetConfirmed = true;
    form.reset(); // restores every control to its initial state
    resetConfirmed = false;

    edited.clear();
    touched.clear();
    summaryRequested = false;
    showForm();
    render();
    showToast(message);
    moveTo("full-name", "center");
  }

  /* ------------------------------------------------------------------------
     Events
     ------------------------------------------------------------------------ */

  // Typing: remember the field was edited and update messages live
  form.addEventListener("input", (event) => {
    if (rules[event.target.name]) edited.add(event.target.name);
    render();
  });

  // Choosing a radio button, checkbox or dropdown option counts as interacting
  form.addEventListener("change", (event) => {
    if (rules[event.target.name]) touched.add(event.target.name);
    render();
  });

  // Leaving a field that was typed in: from now on its error can be shown.
  // Fields that were only tabbed through are flagged on submit instead.
  form.addEventListener("focusout", (event) => {
    const { name, type } = event.target;
    if (edited.has(name) && type !== "radio" && type !== "checkbox") {
      touched.add(name);
      render();
    }
  });

  // Submit Registration
  form.addEventListener("submit", (event) => {
    event.preventDefault(); // nothing is sent: this is a front-end prototype
    FIELDS.forEach(({ name }) => touched.add(name));
    const { values, errors } = render();

    if (Object.keys(errors).length > 0) {
      summaryRequested = true;
      render();
      moveTo("error-summary", "start");
      return;
    }

    summaryRequested = false;
    showConfirmation(values);
  });

  // Reset Form: ask first, unless there is nothing to lose
  form.addEventListener("reset", (event) => {
    if (resetConfirmed) return; // a confirmed reset: let the browser clear the fields
    event.preventDefault();

    if (!hasEntries(readValues())) {
      clearForm("Form cleared.");
    } else if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (window.confirm("Clear the registration form? Everything you have entered will be removed.")) {
      clearForm("Form cleared.");
    }
  });

  // Reset dialog buttons; a click on the backdrop also cancels
  document.getElementById("reset-cancel").addEventListener("click", () => dialog.close());
  document.getElementById("reset-confirm").addEventListener("click", () => {
    dialog.close();
    clearForm("Form cleared.");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Confirmation panel buttons
  document.getElementById("edit-details").addEventListener("click", () => {
    showForm();
    render();
    moveTo("form-title", "start");
  });
  document.getElementById("new-registration").addEventListener("click", () => {
    clearForm("Form cleared. You can start a new registration.");
  });

  // Registration guide: jump to a section of the form
  steps.forEach((step) => {
    const link = step.querySelector("a");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (submitted) {
        showForm();
        render();
      }
      moveTo(link.getAttribute("href").slice(1), "start");
    });
  });

  // First paint
  render();
})();
