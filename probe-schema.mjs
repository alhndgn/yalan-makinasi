
import { manualLieSchema } from './src/shared/schema.ts';
const r = manualLieSchema.safeParse({person:'Ayse', text:'test metin burada', situation:'is_gucu'});
console.log(JSON.stringify(r.success ? r.data : r.error.issues, null, 1));
