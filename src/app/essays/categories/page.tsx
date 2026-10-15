import { TaxonomyIndex } from "@/components/taxonomy-index";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("全部专栏", "/essays/categories/");
export default function CategoriesPage() { return <TaxonomyIndex kind="categories" />; }
