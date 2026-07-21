import type {Metadata} from "next";

export const CRM_PRIVATE_METADATA: Metadata = {
  title: "Vympel CRM",
  description: "Protected Vympel CRM admin interface",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};
