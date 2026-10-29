/**
 * Admin panel customisation: register the "Pending review" homepage widget.
 *
 * Registered at application level (no plugin needed), see:
 * https://docs.strapi.io/cms/admin-panel-customization/homepage
 */

import { Eye } from '@strapi/icons';

export default {
  register(app: any) {
    // Widgets API requires Strapi >= 5.13. Guard so older versions do not crash.
    if (!app.widgets) {
      return;
    }

    app.widgets.register({
      id: 'pending-review',
      icon: Eye,
      title: {
        id: 'admin.widgets.pending-review.title',
        defaultMessage: 'Pending review',
      },
      component: async () => {
        const module = await import('./widgets/PendingReviewWidget');
        return module.default;
      },
    });
  },
  bootstrap() {},
};
