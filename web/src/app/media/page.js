import { cookies } from "next/headers";
import { getSingleType } from "@/lib/strapi";
import MediaClient from "./MediaClient";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const media = await getSingleType("media-page", locale);

  return {
    title: media?.headerTitle || "Media Gallery",
    description:
      media?.headerSubtitle ||
      "Photos, albums on Flickr, press coverage, and media resources from AIRi at UTCN.",
  };
}

export default async function MediaPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const media = await getSingleType("media-page", locale);

  return <MediaClient mediaData={media} />;
}
