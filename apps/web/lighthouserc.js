/** @type {import('@lhci/cli').LighthouseRcConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready on',
      url: [
        'http://localhost:3000/home',
        'http://localhost:3000/adopt',
        'http://localhost:3000/adopt/1',
        'http://localhost:3000/about',
        'http://localhost:3000/blog',
        'http://localhost:3000/donation',
      ],
      numberOfRuns: 1,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
