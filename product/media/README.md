# 홈 영상

## 현재 영상

사용자가 고른 [최우녕 인터뷰](https://www.youtube.com/watch?v=phc1NHab8u8)를 홈에서 재생한다. 채널은 Jungle Dev Club | 크래프톤 정글이다. 사용자의 다운로드 요청에 따라 2026-10-10에 전체 영상과 소리를 내려받았다. 1920×1080 H.264/AAC 원본은 별도로 보관한다.

`woonyong-interview.mp4`는 1280×720 H.264, yuv420p, BT.709, AAC 96kbps, faststart로 변환한 웹 파일이다. 내용은 자르지 않고 처음부터 재생한다. 이전과 같은 펼침·스크롤·재생·일시정지 조작을 쓴다. 포스터는 같은 영상의 10초 프레임이고 재생 시작 지점과는 별개다. 출처 고지 `woonyong-interview-NOTICE.txt`를 영상·포스터와 함께 내보낸다.

```sh
ffmpeg -i original.mp4 -map 0:v:0 -map 0:a:0 \
  -vf "scale=1280:-2:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset medium -crf 26 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 96k -movflags +faststart woonyong-interview.mp4
ffmpeg -ss 10 -i woonyong-interview.mp4 -frames:v 1 -q:v 2 woonyong-interview-poster.jpg
```

## 보관한 Manta Code Blocks 데모

Manta Code Blocks의 공개 데모는 보존하되 현재 홈에서는 사용하지 않는다. 첫 프레임은 같은 영상에서 추출한 포스터다. 영상 자체의 녹화 버전과 시간을 바꾸지 않는다.

- [공개 원본](https://github.com/woonyong-choi/manta-code-blocks/blob/cddab44041bb4e7e78c5783c04d1cb8707bf55a4/docs/assets/manta-code-blocks-intro.mp4)
- [프로젝트와 사용 안내](https://github.com/woonyong-choi/manta-code-blocks)
- [MIT 라이선스](https://github.com/woonyong-choi/manta-code-blocks/blob/cddab44041bb4e7e78c5783c04d1cb8707bf55a4/LICENSE)

`manta-code-blocks-intro.mp4`는 내려받은 원본(H.264, `gbrp` RGB, 전체 범위)이라 크롬 등에서 색이 분홍으로 어긋난다. 보존만 하고 웹 호환 변환본 `manta-code-blocks-intro-web.mp4`를 함께 둔다. 변환 명령:

```sh
ffmpeg -i manta-code-blocks-intro.mp4 -map 0:v:0 -an \
  -vf "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -profile:v high \
  -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv \
  -movflags +faststart manta-code-blocks-intro-web.mp4
```

두 MP4는 1600×900, 6초이고 소리가 없다. 새 웹 영상은 `yuv420p`, BT.709, `+faststart`로 만든다. 포스터는 첫 프레임의 PNG다. 발행 과정은 사용하는 미디어와 원본 MIT 고지인 `manta-code-blocks-LICENSE.txt`를 함께 포함한다. 이 문서는 내보내지 않는다.
