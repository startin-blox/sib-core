/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: '/',
  },
  plugins: [
    '@snowpack/plugin-babel',
    [
      '@snowpack/plugin-run-script',
      {
        cmd: 'tsc --noEmit',
        watch: '$1 --watch',
      },
    ],
  ],
  packageOptions: {
    installTypes: true,
  },
  buildOptions: {
    sourcemap: true,
    minify: false,
    out: 'dist',
  },
};
