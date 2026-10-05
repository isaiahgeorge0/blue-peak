export const sitePhoneDisplay = "01234 567890";
export const sitePhoneTel = "+441234567890";

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
