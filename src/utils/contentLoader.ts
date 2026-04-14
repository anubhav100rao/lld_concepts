// This utility is designed to lazily load markdown files from the `content` directory.
// Once you add files like `content/core-infrastructure.md`, Vite will resolve them.

// Use Vite's import.meta.glob to dynamically discover all markdown files outside of src
// This requires no special vite config as long as we are in the root workspace.
const markdownFiles = import.meta.glob('../../content/**/*.md', { query: '?raw', import: 'default' });

export const getMarkdownContent = async (slug: string): Promise<string> => {
  // We expect files in `../content/` to potentially map to slug names.
  // E.g., `content/core-infrastructure.md` or `content/core-infrastructure/index.md`
  
  const possiblePaths = [
    `../../content/${slug}.md`,
    `../../content/${slug}/index.md`
  ];

  for (const path of possiblePaths) {
    if (path in markdownFiles) {
      try {
        const content = await markdownFiles[path]();
        return content as unknown as string;
      } catch (error) {
        console.error(`Error loading markdown file ${path}:`, error);
      }
    }
  }

  // If no content found (which is expected initially before you populate it), 
  // return a placeholder message.
  return `
# Content Not Found

Could not find any content for **${slug}**. 

**Next Steps:**
Please create a file at \`content/${slug}.md\` in your workspace to populate this page.
The architecture dictates each solution should have:
1. Core classes/interfaces
2. Database schemas
3. Data structures with justification
4. Details on concurrency
  `;
};

// Map markdown files to their respective Sidebar category ID
export const TOPIC_MAPPING: Record<string, string> = {
  'url_shortner': 'practical-systems',
  'distributed_lock': 'concurrency',
  'distributed_unique_id_generator': 'core-infrastructure',
  'notification_service': 'messaging',
  'redis': 'caching',
  'elevator_design': 'practical-systems',
  'ride_matching_engine': 'practical-systems',
  'code_deployment_pipeline': 'practical-systems',
  'permission_systems': 'api',
  'back_of_the_envelope_calculations': 'core-infrastructure',
  'dynamic_programming': 'algorithms',
  'binary_search': 'algorithms',
  'graphs': 'algorithms',
  'greedy': 'algorithms',
  'priority_queue': 'algorithms',
  'stack_queue': 'algorithms',
  'tries': 'algorithms',
  'arrays': 'algorithms',
  'trees': 'algorithms',
  'two_pointers_sliding_window': 'algorithms',
};

// Ordered list of all category IDs (matches sidebar order)
export const CATEGORY_ORDER = [
  'core-infrastructure',
  'concurrency',
  'networking',
  'messaging',
  'api',
  'file-systems',
  'payments',
  'observability',
  'caching',
  'practical-systems',
  'algorithms',
];

// Returns a flat ordered list of all navigable topic slugs
export const getAllTopicSlugs = (): string[] => {
  const result: string[] = [];
  for (const catId of CATEGORY_ORDER) {
    result.push(catId);
    const subs = getSubTopicsForCategory(catId);
    for (const sub of subs) {
      result.push(sub.id);
    }
  }
  return result;
};

export const getSubTopicsForCategory = (categoryId: string): { id: string; title: string }[] => {
  const subTopics: { id: string; title: string }[] = [];
  
  for (const path of Object.keys(markdownFiles)) {
    const match = path.match(/\.\.\/\.\.\/content\/(.+)\.md$/);
    if (match) {
      const slugMatch = match[1];
      if (TOPIC_MAPPING[slugMatch] === categoryId) {
        // Create title from slug (e.g. url_shortner -> Url Shortner)
        const title = slugMatch
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        subTopics.push({ id: slugMatch, title });
      }
    }
  }
  return subTopics;
};
