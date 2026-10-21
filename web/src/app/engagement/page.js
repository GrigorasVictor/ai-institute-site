import FallbackDisclaimer from "@/components/FallbackDisclaimer";
import { cookies } from "next/headers";
import { Suspense } from "react";
import EngagementClient from "./EngagementClient";
import CollaboratorsClient from "../collaborators/CollaboratorsClient";
import { getPartners, getProjects, transformPartnerData, transformProjectData, getSingleType } from "@/lib/strapi";

const ENGAGEMENT_PAGE_POPULATE = {
  publicContent: {
    on: {
      "shared.cta": {},
      "shared.focus-item": {},
      "shared.card": {
        populate: {
          image: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
            "shared.separator": {},
          },
        },
      },
      "shared.card-grid": {
        populate: {
          cards: {
            populate: {
              image: {
                fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
              },
            },
          },
        },
      },
      "shared.rich-text": {},
      "shared.quote": {},
      "shared.section": {
        populate: {
          media: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
          },
        },
      },
      "shared.media": {
        populate: {
          file: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
          },
        },
      },
      "shared.slider": {
        populate: {
          files: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
          },
        },
      },
    },
  },
  academicContent: {
    on: {
      "shared.cta": {},
      "shared.focus-item": {},
      "shared.card": {
        populate: {
          image: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
          },
        },
      },
      "shared.card-grid": {
        populate: {
          cards: {
            populate: {
              image: {
                fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
              },
            },
          },
        },
      },
      "shared.rich-text": {},
      "shared.quote": {},
      "shared.section": {
        populate: {
          media: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
          },
        },
      },
      "shared.media": {
        populate: {
          file: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
          },
        },
      },
      "shared.slider": {
        populate: {
          files: {
            fields: ["url", "mime", "alternativeText", "caption", "formats", "width", "height"],
          },
        },
      },
      "shared.separator": {},
    },
  },
};
const ENGAGEMENT_PAGE_FETCH_OPTIONS = { cache: "no-store" };

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const engagement = await getSingleType(
    "engagement-page",
    locale,
    ENGAGEMENT_PAGE_POPULATE,
    ENGAGEMENT_PAGE_FETCH_OPTIONS,
  );

  return {
    title: engagement?.heroTitle || "Engagement",
    description: engagement?.heroSubtitle || "Discover how AIRi engages with industry, academia, high-school students, and the public through partnerships and programs.",
  };
}

export default async function EngagementPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  const [strapiProjects, partnerRows, pageData] = await Promise.all([
    getProjects({ locale }),
    getPartners({ locale }),
    getSingleType(
      "engagement-page",
      locale,
      ENGAGEMENT_PAGE_POPULATE,
      ENGAGEMENT_PAGE_FETCH_OPTIONS,
    ),
  ]);

  const projects = transformProjectData(strapiProjects);
  const partners = transformPartnerData(partnerRows);

  return (
    <>
      <FallbackDisclaimer isFallback={pageData?._isFallback} />
      <Suspense fallback={null}>
      <EngagementClient
        projects={projects}
        partners={partners}
        CollaboratorsClient={CollaboratorsClient}
        pageData={pageData}
      />
    </Suspense>
    </>
  );
}
