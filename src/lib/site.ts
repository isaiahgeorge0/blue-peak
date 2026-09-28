export const sitePhoneDisplay = "01234 567890";
export const sitePhoneTel = "+441234567890";

export type TeamMember = {
  name: string;
  role: string;
  blurb: string;
  /** Stock placeholder headshot; swap for a real Blue Peak photo later. */
  imageSrc: string;
};

export const teamMembers: TeamMember[] = [
  {
    name: "Tom Harris",
    role: "Builder and co-founder",
    blurb:
      "Handles structure, joinery, and the day-to-day sequencing on site so each job stays tidy and on track.",
    imageSrc: "/home/team-tom.jpg",
  },
  {
    name: "James Cole",
    role: "Builder and co-founder",
    blurb:
      "Focuses on finishes, client updates, and making sure the written quote matches what gets delivered.",
    imageSrc: "/home/team-james.jpg",
  },
];
