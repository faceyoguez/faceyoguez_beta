// One-off build step: bundles Zoom's classic Client View SDK (ZoomMtg) together
// with the exact old peer-dependency versions it needs (React 18, Redux 4,
// Redux-Thunk 2, React-Redux 8, Lodash 4) into a single self-contained script.
//
// This exists because Zoom's own `zoomus-websdk.umd.min.js` has broken browser-
// global externals (it can't find React/Redux/Redux-Thunk when loaded via a plain
// <script> tag — confirmed by reading the file directly), so the usual "copy the
// prebuilt file into public/vendor" trick (used for Component View) doesn't work
// here. Running it through a real bundler with aliased deps fixes that.
//
// The output is loaded inside public/zoom-embed.html, isolated in an iframe with
// its own React 18 — needed because Zoom's SDK crashes under the app's React 19.
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.join(__dirname, 'entry.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  outfile: path.join(__dirname, '../public/vendor/zoom-meetingsdk/zoom-client-view.bundle.js'),
  alias: {
    react: 'react18',
    'react-dom': 'react-dom18',
    redux: 'zoom-redux',
    'redux-thunk': 'zoom-redux-thunk',
    'react-redux': 'zoom-react-redux',
    lodash: 'zoom-lodash',
  },
  logLevel: 'info',
});
