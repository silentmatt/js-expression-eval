import rollupConfig from './rollup.config';

rollupConfig.plugins = [];
rollupConfig.output.file = 'dist/index.mjs';
rollupConfig.output.format = 'esm';

export default rollupConfig;
