// Read Swagger YAML
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spec = fs.readFileSync(path.resolve(__dirname, '../data/swagger_output.yml'));
const swaggerSpec = yaml.load(spec);

export default swaggerSpec;
