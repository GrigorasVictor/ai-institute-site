export default {
  documents: {
    // Enforce required media and relations on publication, while allowing drafts.
    strictRelations: true,
  },
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
};
