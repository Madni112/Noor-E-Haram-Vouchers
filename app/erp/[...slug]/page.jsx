import ErpPortalPage from '../page';
import { resolveTabFromSlug } from '../../../lib/erpRouting';

export default async function ErpDynamicModulePage({ params }) {
  const resolvedParams = params ? await params : {};
  const initialTab = resolveTabFromSlug(resolvedParams?.slug);
  return <ErpPortalPage initialTab={initialTab} />;
}
