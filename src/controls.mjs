// 경로를 정한 뒤 공통 조작 아이콘을 조립한다.
import { ControlImage } from './vendor/theme/ui/index.mjs';
export const controlImage = (name, className = '', base = '') => String(ControlImage(name, className, base));
