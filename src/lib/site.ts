export const sitePhoneDisplay = "01234 567890";
export const sitePhoneTel = "+441234567890";

export type HowWeWorkStep = {
  title: string;
  body: string;
  /** Short serif line shown under the body on the homepage's animated version. */
  caption?: string;
};

/** The four stages of a job, shown on the homepage and the service pages. */
export const howWeWorkSteps: HowWeWorkStep[] = [
  {
    title: "Enquire",
    body: "Tell us what you want doing. We will say quickly whether it is a job we can take on.",
  },
  {
    title: "Get a fixed quote",
    body: "We visit the property, measure up, and send a written price before any work is booked.",
    caption: "Every job starts on paper",
  },
  {
    title: "Book the work",
    body: "Agree a start date, we protect the house, and we stay on it until the job is finished.",
    caption: "You get photos, not surprises",
  },
  {
    title: "Handover",
    body: "We walk the finished job with you before we call it done.",
  },
];

/*
 * Real headshots of Kyle and Steven are needed. Until then the homepage and
 * About page show a BrandMark tile in place of a photo.
 */
export type TeamMember = {
  name: string;
  role: string;
  blurb: string;
};

export const teamMembers: TeamMember[] = [
  {
    name: "Kyle",
    role: "Co-founder",
    blurb:
      "Handles structure, joinery, and the day-to-day sequencing on site so each job stays tidy and on track.",
  },
  {
    name: "Steven",
    role: "Co-founder",
    blurb:
      "Focuses on finishes, client updates, and making sure the written quote matches what gets delivered.",
  },
];
