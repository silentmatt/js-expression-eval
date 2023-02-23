import rollupConfig from './rollup.config';
import { terser } from 'rollup-plugin-terser';

rollupConfig.plugins = [ terser() ];
rollupConfig.output.file = 'dist/bundle.min.js';

export default rollupConfig;
