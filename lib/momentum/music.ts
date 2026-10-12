export interface Track {
  id: string;
  title: string;
  composer: string;
  src: string; // đường dẫn tính từ thư mục public, phải khớp tên file (chữ hoa/thường)
  seconds: number; // độ dài thật của file, tính bằng giây
  credit?: string; // nguồn và giấy phép của bản thu
}

// THAY số "seconds" bằng độ dài thật; ghi nguồn bản thu vào "credit"
export const TRACKS: Track[] = [
  {
    id: "gymnopedie-1",
    title: "Gymnopédie No. 1",
    composer: "Erik Satie",
    src: "/audio/classical/Gymnopedie1.mp3",
    seconds: 166, // TẠM TÍNH, sửa lại
    credit: "Nguồn và giấy phép bản thu: cần điền",
  },
  {
    id: "gymnopedie-2",
    title: "Gymnopédie No. 2",
    composer: "Erik Satie",
    src: "/audio/classical/Gymnopedie2.mp3",
    seconds: 196, // TẠM TÍNH, sửa lại
    credit: "Nguồn và giấy phép bản thu: cần điền",
  },
  {
    id: "fur-elise",
    title: "Für Elise",
    composer: "Ludwig van Beethoven",
    src: "/audio/classical/Furelise.mp3",
    seconds: 170, // TẠM TÍNH, sửa lại
    credit: "Nguồn và giấy phép bản thu: cần điền",
  },
];

// Tạo danh sách phát có tổng thời lượng gần targetSeconds nhất (không vượt quá 15%)
export function buildPlaylist(
  targetSeconds: number,
  tracks: Track[] = TRACKS,
): Track[] {
  if (tracks.length === 0) return [];
  const limit = targetSeconds * 1.15;
  let best: Track[] = [];
  let bestGap = Infinity;

  for (let attempt = 0; attempt < 40; attempt++) {
    const pool = [...tracks].sort(() => Math.random() - 0.5);
    const picked: Track[] = [];
    let total = 0;
    for (const track of pool) {
      if (total + track.seconds <= limit) {
        picked.push(track);
        total += track.seconds;
      }
    }
    const gap = Math.abs(targetSeconds - total);
    if (picked.length > 0 && gap < bestGap) {
      best = picked;
      bestGap = gap;
    }
  }

  // Không bài nào vừa (bài nào cũng dài hơn giới hạn): lấy bài ngắn nhất
  if (best.length === 0) {
    const shortest = [...tracks].sort((a, b) => a.seconds - b.seconds)[0];
    return shortest ? [shortest] : [];
  }
  return best;
}
