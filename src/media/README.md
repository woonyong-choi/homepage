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

## Markdown 문서 예시

`manta-code-blocks-poster.png`는 승인된 Markdown 문법 예시에서 쓰는 Manta Code Blocks 데모의 첫 프레임이다. 해당 이미지와 `manta-code-blocks-LICENSE.txt`만 발행한다. 사용하지 않는 동영상은 홈페이지에 포함하지 않는다.
