import { TaxonomyIndex } from "@/components/taxonomy-index";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("全部专题", "/essays/tags/");
export default function TagsPage() { return <TaxonomyIndex kind="tags" />; }
