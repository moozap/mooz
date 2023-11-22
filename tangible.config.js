export default {
  build: [
    {
      src: 'src/global.ts',
      dest: 'build/mooz.js',
    },
    {
      src: 'src/test/index.tsx',
      dest: 'build/test.js',
    },
    {
      src: 'src/index.html',
      dest: 'build',
    },
  ],
  format: 'src',
  serve: {
    dir: 'build',
  },
}
