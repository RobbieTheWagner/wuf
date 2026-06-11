export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tailwind uses bare string imports, e.g. @import 'tailwindcss'
    'import-notation': 'string',
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'apply',
          'config',
          'custom-variant',
          'plugin',
          'reference',
          'source',
          'tailwind',
          'theme',
          'utility',
          'variant',
        ],
      },
    ],
  },
};
