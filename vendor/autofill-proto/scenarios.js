/* Synthetic simulations of the photo and auto-fill flow. */
const profiles = [
  {
    "id": 1,
    "name": "Lucía",
    "context": "Mobile · Spanish ID card · first time",
    "expectation": "Know which side to photograph without having to understand what MRZ means.",
    "risk": "Photographs the front and gets a generic error.",
    "feedback": "The guide helps, but I need to see the lines I'm supposed to look for.",
    "decision": "D01 · Visual example of the lines and a \"I can't find these lines\" option.",
    "scenario": "wrong-side",
    "residual": "Validate the guide with several generations of ID cards."
  },
  {
    "id": 2,
    "name": "James",
    "context": "Mobile · passport · arriving in a hurry",
    "expectation": "Take a photo and see the fields filled in with as few steps as possible.",
    "risk": "A mandatory review screen adds work to a clear reading.",
    "feedback": "If it has been read correctly, I want to see the form filled in right away.",
    "decision": "D02 · Reliable reading: close the panel and apply directly, with visible confirmation.",
    "scenario": "success",
    "residual": "Measure whether they notice the filled fields without an extra screen."
  },
  {
    "id": 3,
    "name": "Carmen",
    "context": "Little digital experience · mobile",
    "expectation": "Short instructions and an obvious button at every step.",
    "risk": "Doesn't understand permissions or when the photo is taken.",
    "feedback": "I prefer to press the button myself and be able to go back.",
    "decision": "D03 · Explicit capture, simple text and a visible way out.",
    "scenario": "success",
    "residual": "Check comprehension without a moderator's help."
  },
  {
    "id": 4,
    "name": "Álex",
    "context": "Laminated document · glare",
    "expectation": "To be told how to improve a failed photo.",
    "risk": "Retakes the same photo over and over.",
    "feedback": "\"Could not be read\" doesn't tell me what to change.",
    "decision": "D04 · Specific message when there is a reliable signal; manual entry prioritized after two failures.",
    "scenario": "glare",
    "residual": "The provider must tell glare apart from blur; otherwise, show a neutral message."
  },
  {
    "id": 5,
    "name": "Marta",
    "context": "Older Android · blurry camera",
    "expectation": "Have a way out if the camera can't take a sharp photo.",
    "risk": "Retry loop or the device freezing.",
    "feedback": "After two attempts I'd rather type and move on.",
    "decision": "D04 · Optional retry and a manual alternative from the start.",
    "scenario": "blur",
    "residual": "Test performance on real low-end devices."
  },
  {
    "id": 6,
    "name": "Noah",
    "context": "Camera permission denied",
    "expectation": "Recover without having to understand browser settings.",
    "risk": "The system keeps asking for the same permission.",
    "feedback": "Let me choose a photo or enter my details.",
    "decision": "D05 · Don't re-request the permission automatically; offer photo upload and manual entry.",
    "scenario": "denied",
    "residual": "The prototype simulates the permission; validate on real Safari and Chrome."
  },
  {
    "id": 7,
    "name": "Sofía",
    "context": "Laptop without a camera",
    "expectation": "Be able to read an existing image when there is no camera.",
    "risk": "The experience assumes a mobile phone.",
    "feedback": "The computer needs a clear way out too.",
    "decision": "D05 · Image and manual paths; handing off to mobile is out of the MVP.",
    "scenario": "desktop",
    "residual": "Real file upload and its limits depend on the provider."
  },
  {
    "id": 8,
    "name": "Hugo",
    "context": "Mobile · connection interrupted during reading",
    "expectation": "Not having to retake the photo if only the connection fails.",
    "risk": "A network failure is shown as a defective photo.",
    "feedback": "The photo was fine; I want to retry reading it, not take it again.",
    "decision": "D06 · Tell an unreadable photo apart from a service failure; retry the same capture.",
    "scenario": "offline",
    "residual": "Integrate temporary in-memory retention and a real provider retry."
  },
  {
    "id": 9,
    "name": "Amina",
    "context": "Transliterated name on the document",
    "expectation": "Recognize and correct their name without changing their identity.",
    "risk": "The transliteration is presented as the final name.",
    "feedback": "Let me correct it, and explain that it comes from the document.",
    "decision": "D07 · Apply the transliteration as read without reconstructing spellings, and show where it came from.",
    "scenario": "names",
    "residual": "Validate that users recognize the value that was read when they see it in the form."
  },
  {
    "id": 10,
    "name": "José Luis",
    "context": "Passport · lines cut off at the edges",
    "expectation": "Know how much of the document needs to be in the photo.",
    "risk": "Only photographs the middle of the lines.",
    "feedback": "I need to know the lines must be visible from start to end.",
    "decision": "D08 · Frame with margin and a specific framing error when detectable.",
    "scenario": "cropped",
    "residual": "Check cropping tolerance with the real provider."
  },
  {
    "id": 11,
    "name": "Sari",
    "context": "Gallery photo · rotated document",
    "expectation": "Not having to edit the photo by hand for it to be read.",
    "risk": "A readable image is rejected only because of its orientation.",
    "feedback": "You could rotate it before asking me for another photo.",
    "decision": "D09 · Normalize orientation before reading; the demo shows a successful reading.",
    "scenario": "rotated",
    "residual": "Real rotation depends on image processing; it does not exist in the demo."
  },
  {
    "id": 12,
    "name": "Wei",
    "context": "Worn document · one doubtful character",
    "expectation": "Correct only the character that could not be read.",
    "risk": "A made-up document number is inserted, or the whole reading is lost.",
    "feedback": "Show me the doubtful field and keep what was read correctly.",
    "decision": "D10 · Review only the doubtful number; no retyping everything.",
    "scenario": "partial",
    "residual": "Calibrate per-field confidence with the OCR provider."
  },
  {
    "id": 13,
    "name": "Paula",
    "context": "Older document without a machine-readable zone",
    "expectation": "Manual entry to be accepted as a normal path.",
    "risk": "Interprets \"no MRZ\" as an invalid document.",
    "feedback": "My document is real; don't say it's invalid just because it can't be read.",
    "decision": "D11 · Document without MRZ: explain the scanning limit and return to the form.",
    "scenario": "no-mrz",
    "residual": "Don't confuse readability with document validity."
  },
  {
    "id": 14,
    "name": "Eva",
    "context": "Privacy concerns",
    "expectation": "Understand what the photo is for before granting camera access.",
    "risk": "Leaves if the camera opens without context.",
    "feedback": "Explain what the photo is for and let me leave before the camera opens.",
    "decision": "D12 · Upfront explanation, visible close button, and permission requested only when tapping the camera.",
    "scenario": "privacy",
    "residual": "Link the real image-processing text before integrating."
  },
  {
    "id": 15,
    "name": "Daniel",
    "context": "Low vision · zoom and screen reader",
    "expectation": "Instructions and messages that can be read with zoom or a screen reader.",
    "risk": "The camera and placeholders are the only way to interact.",
    "feedback": "I need to hear whether it is reading, whether it failed, and when it has filled in the fields.",
    "decision": "D13 · Labels, focused dialog, status announcements and an end-of-auto-fill message.",
    "scenario": "accessible",
    "residual": "Validate with VoiceOver/TalkBack; taking the photo manually may require help."
  },
  {
    "id": 16,
    "name": "Óscar",
    "context": "Reduced mobility · unsteady hand",
    "expectation": "Not depend on holding the document in a precise position.",
    "risk": "Capture that is too demanding or timed.",
    "feedback": "I want to use an existing photo without rushing.",
    "decision": "D03 / D05 · No countdown; existing image and manual entry.",
    "scenario": "desktop",
    "residual": "Evaluate capture aids with real people."
  },
  {
    "id": 17,
    "name": "Laura",
    "context": "Photo with two documents in the same image",
    "expectation": "Know whether to photograph the documents together or separately.",
    "risk": "Details from two documents get mixed.",
    "feedback": "Tell me to photograph only one document at a time.",
    "decision": "D14 · One document per photo; reject multi-document captures when detected.",
    "scenario": "multiple",
    "residual": "Requires detection of multiple MRZ zones or a signal from the provider."
  },
  {
    "id": 18,
    "name": "Diego",
    "context": "Form already partially filled in",
    "expectation": "Keep what they typed while trying the scan.",
    "risk": "A new reading silently replaces correct values.",
    "feedback": "I want to choose between the previous value and the one that was read.",
    "decision": "D15 · If there are differences, keep what was typed by default and choose per field.",
    "scenario": "conflict",
    "residual": "Applying to the form must be atomic and must not lose earlier edits."
  },
  {
    "id": 19,
    "name": "Emma",
    "context": "Room with low light",
    "expectation": "A concrete tip to get a readable image.",
    "risk": "Doesn't know whether to move closer, focus or find more light.",
    "feedback": "Ask me to move somewhere brighter, instead of making me retry blindly.",
    "decision": "D16 · Lighting help when there is a reliable signal; guided retry.",
    "scenario": "dark",
    "residual": "Avoid diagnosing darkness without a real measurement."
  },
  {
    "id": 20,
    "name": "Bruno",
    "context": "Reading service slow or down",
    "expectation": "Know it is still reading and be able to leave if it takes too long.",
    "risk": "Endless spinner, or a late result that fills the form after cancelling.",
    "feedback": "I want to cancel without the details showing up later by surprise.",
    "decision": "D17 · Cancellation, timeout and discarding of late results.",
    "scenario": "timeout",
    "residual": "Check real cancellation and define timings with the provider."
  }
];
if (typeof module !== 'undefined') module.exports = profiles;
