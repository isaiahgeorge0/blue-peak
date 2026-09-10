export type Service = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
};

export type Project = {
  slug: string;
  title: string;
  location: string;
  shortDescription: string;
  longDescription: string;
};

export type ServiceArea = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
};

export const services: Service[] = [
  {
    slug: "kitchen-renovations",
    name: "Kitchen renovations",
    shortDescription:
      "Full kitchen strip-outs and renovations, from layout changes to new units and flooring.",
    longDescription:
      "We take kitchens apart carefully, protect the rest of the house, and rebuild to a plan you have already priced. Typical work includes moving plumbing and electrics, fitting units, worktops, splashbacks, and finishing floors so the room is ready to use.",
  },
  {
    slug: "bathroom-renovations",
    name: "Bathroom renovations",
    shortDescription:
      "Complete bathroom strip-outs, tiling, and fitting for family homes.",
    longDescription:
      "We remove the old suite, check the substrate, and rebuild with new sanitaryware, tiling, and waterproofing. Jobs are quoted after measuring up, and we keep dust and disruption contained so the rest of the house stays usable.",
  },
  {
    slug: "extensions",
    name: "Extensions",
    shortDescription:
      "Single-storey rear and side extensions built to a fixed quote before we start.",
    longDescription:
      "From groundworks through to plaster and paint, we build domestic extensions with clear milestones. You get a written price after a site visit, a start date you can plan around, and one team on the job until the shell and interiors are finished.",
  },
  {
    slug: "conservatories",
    name: "Conservatories",
    shortDescription:
      "New conservatories and lean-tos, plus repairs and upgrades to existing ones.",
    longDescription:
      "We build and renovate conservatories that stay usable year round. That covers bases, frames, glazing, roofs, and the join into the house, with a written quote after we have seen the property and measured up.",
  },
  {
    slug: "roofing",
    name: "Roofing",
    shortDescription:
      "Roof repairs, re-roofs, and weatherproofing for houses and outbuildings.",
    longDescription:
      "From slipped tiles and leaking valleys to full re-roofs, we handle the work ourselves and leave the property watertight. Quotes cover materials, labour, and making good at flashings, gutters, and barge boards where needed.",
  },
  {
    slug: "flooring",
    name: "Flooring",
    shortDescription:
      "Timber, laminate, vinyl, and tile flooring fitted as part of a wider job or on its own.",
    longDescription:
      "We prepare the substrate, level where needed, and fit flooring that matches the room. Useful as a standalone job or as the finishing stage of a kitchen, bathroom, or full renovation.",
  },
  {
    slug: "loft-conversions",
    name: "Loft conversions",
    shortDescription:
      "Loft conversions that turn unused roof space into bedrooms, offices, or storage.",
    longDescription:
      "We assess head height, access, and structure before quoting, then build out the loft with stairs, insulation, windows, and finishes. You get a fixed price after a site visit and a clear plan for how the space will work day to day.",
  },
  {
    slug: "general-renovations",
    name: "General renovations",
    shortDescription:
      "Room-by-room and whole-house renovations covering multiple trades in one team.",
    longDescription:
      "Carpentry, plastering, doors, flooring, and finishing work packaged as one job. Useful when you want several rooms brought up to standard without juggling separate trades. We agree scope in writing and stay on site until the list is done.",
  },
];

export const projects: Project[] = [
  {
    slug: "ipswich-kitchen-dining",
    title: "Kitchen and dining refit",
    location: "Ipswich",
    shortDescription:
      "New layout, units, and flooring in a Victorian terrace.",
    longDescription:
      "The owners wanted a clearer run from kitchen to dining without losing the character of the house. We opened the layout slightly, fitted new units and flooring, and finished the room to match the existing joinery.",
  },
  {
    slug: "felixstowe-rear-extension",
    title: "Rear extension",
    location: "Felixstowe",
    shortDescription:
      "Single-storey addition opening onto the garden.",
    longDescription:
      "A rear extension to create a family dining space with doors onto the garden. We handled the build from foundations through to internal finishes, including the junction with the existing house so the new room felt continuous.",
  },
  {
    slug: "woodbridge-bathroom",
    title: "Bathroom renovation",
    location: "Woodbridge",
    shortDescription:
      "Full strip-out, tiling, and a walk-in shower.",
    longDescription:
      "A tired family bathroom stripped back and rebuilt with a walk-in shower, new tiling, and updated sanitaryware. The brief was a clean, durable finish that would stand up to daily use without looking clinical.",
  },
  {
    slug: "colchester-internal-refurb",
    title: "Internal refurbishment",
    location: "Colchester",
    shortDescription:
      "Hall, stairs, and living rooms brought up to a consistent finish.",
    longDescription:
      "A mid-terrace house with mismatched finishes across the ground floor. We reworked the hall and stairs, repaired plaster, fitted new doors and skirtings, and left the living spaces ready for decoration with a consistent standard throughout.",
  },
];

export const serviceAreas: ServiceArea[] = [
  {
    slug: "ipswich",
    name: "Ipswich",
    shortDescription:
      "Building and renovation work across Ipswich and the surrounding estates.",
    longDescription:
      "We are based in Ipswich and take on kitchens, bathrooms, extensions, and refurbs across the town. Site visits are usually quick to arrange, and we stay local so we can keep jobs moving without long travel days.",
  },
  {
    slug: "felixstowe",
    name: "Felixstowe",
    shortDescription:
      "Domestic building work for homes in Felixstowe and the coast.",
    longDescription:
      "From terrace refurbs to rear extensions, we work with Felixstowe homeowners who want a clear written quote and a small team on the job. Site visits are usually available within a few days of your enquiry.",
  },
  {
    slug: "woodbridge",
    name: "Woodbridge",
    shortDescription:
      "Kitchens, bathrooms, and refurbs for Woodbridge homes.",
    longDescription:
      "Woodbridge is part of our regular Suffolk patch. If you are planning a kitchen, bathroom, or internal refurb, send photos and a short brief and we will confirm whether it is a job we can take on.",
  },
  {
    slug: "colchester",
    name: "Colchester",
    shortDescription:
      "Building and renovation work for Colchester and nearby villages.",
    longDescription:
      "Colchester sits within easy reach of Ipswich for us. We quote after seeing the property, protect floors and gardens while we work, and keep the job moving until it is finished.",
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getServiceAreaBySlug(slug: string): ServiceArea | undefined {
  return serviceAreas.find((area) => area.slug === slug);
}

export const siteUrl = "https://bluepeaksolutions.com";
