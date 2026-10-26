// 승인 사본·자산·색인의 내용 해시를 한 형식(소문자 16진수 SHA-256)으로 계산한다.
import { createHash } from 'node:crypto';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
