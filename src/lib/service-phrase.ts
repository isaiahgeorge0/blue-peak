/** What {service} becomes in an email: a phrase that reads after "about" or "for". */
const SERVICE_PHRASES: Record<string, string> = {
  "kitchen-renovations": "your kitchen renovation",
  "bathroom-renovations": "your bathroom renovation",
  extensions: "your extension",
  conservatories: "your conservatory",
  roofing: "your roofing work",
  flooring: "your flooring",
  "loft-conversions": "your loft conversion",
  "general-renovations": "your renovation",
};

export function servicePhrase(serviceType: string | null | undefined) {
  return SERVICE_PHRASES[serviceType?.trim() ?? ""] ?? "your project";
}
